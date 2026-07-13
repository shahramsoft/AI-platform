import { AIProvider, ChatMessage } from '@org/ai-core';
import { ConversationMemory } from '@org/memory';

export interface ChatServiceRequest {
  conversationId: string;
  model: string;
  message: string;
}

export interface ChatServiceResponse {
  conversationId: string;
  reply: string;
}

export class ChatService {
  constructor(
    private readonly provider: AIProvider,
    private readonly memory: ConversationMemory
  ) {}

  async send(request: ChatServiceRequest): Promise<ChatServiceResponse> {
    const userMessage: ChatMessage = {
      role: 'user',
      content: request.message,
    };
    this.memory.append(request.conversationId, userMessage);

    const history = this.memory.getHistory(request.conversationId);
    const response = await this.provider.chat({
      model: request.model,
      messages: history,
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
}
