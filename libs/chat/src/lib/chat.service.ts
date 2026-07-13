import { AIProvider, ChatMessage } from '@org/ai-core';
import { ConversationMemory } from '@org/memory';
import { RagService } from '@org/rag';

const DEFAULT_EMBEDDING_MODEL = 'nomic-embed-text:latest';
const RAG_TOP_K = 3;

export interface ChatServiceRequest {
  conversationId: string;
  model: string;
  message: string;
  useRag?: boolean;
}

export interface ChatServiceResponse {
  conversationId: string;
  reply: string;
}

export class ChatService {
  constructor(
    private readonly provider: AIProvider,
    private readonly memory: ConversationMemory,
    private readonly rag?: RagService,
    private readonly embeddingModel: string = DEFAULT_EMBEDDING_MODEL
  ) {}

  async send(request: ChatServiceRequest): Promise<ChatServiceResponse> {
    const userMessage: ChatMessage = {
      role: 'user',
      content: request.message,
    };
    this.memory.append(request.conversationId, userMessage);

    const history = this.memory.getHistory(request.conversationId);
    const contextMessages = await this.buildRagContext(request);

    const response = await this.provider.chat({
      model: request.model,
      messages: [...contextMessages, ...history],
    });

    this.memory.append(request.conversationId, {
      role: 'assistant',
      content: response.content,
    });

    return {
      conversationId: request.conversationId,
      reply: response.content,
    };
  }

  private async buildRagContext(
    request: ChatServiceRequest
  ): Promise<ChatMessage[]> {
    if (!this.rag || !request.useRag) {
      return [];
    }

    const results = await this.rag.retrieve({
      query: request.message,
      model: this.embeddingModel,
      topK: RAG_TOP_K,
    });

    if (results.length === 0) {
      return [];
    }

    const context = results.map((result) => `- ${result.text}`).join('\n');

    return [
      {
        role: 'system',
        content: `Use the following retrieved context if it is relevant to the user's question:\n${context}`,
      },
    ];
  }
}
