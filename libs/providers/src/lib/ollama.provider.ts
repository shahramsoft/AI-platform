import {
  AIProvider,
  ChatMessage,
  ChatRequest,
  ChatResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  ProviderRequestError,
  ProviderUnavailableError,
  ToolCall,
  ToolDefinition,
} from '@org/ai-core';

export interface OllamaProviderConfig {
  baseUrl: string;
}

interface OllamaToolCall {
  id?: string;
  function?: { name?: string; arguments?: Record<string, unknown> };
}

interface OllamaChatResponseBody {
  message?: { content?: string; tool_calls?: OllamaToolCall[] };
}

interface OllamaTagsResponseBody {
  models?: Array<{ name: string }>;
}

interface OllamaEmbedResponseBody {
  embeddings?: number[][];
}

export class OllamaProvider implements AIProvider {
  readonly name = 'ollama';

  constructor(private readonly config: OllamaProviderConfig) {}

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await this.post('/api/chat', {
      model: request.model,
      messages: request.messages.map((message) => this.toOllamaMessage(message)),
      tools: this.toOllamaTools(request.tools),
      stream: false,
    });

    if (!response.ok) {
      throw new ProviderRequestError(this.name, `HTTP ${response.status}`);
    }

    const body = (await response.json()) as OllamaChatResponseBody;
    const toolCalls = this.fromOllamaToolCalls(body.message?.tool_calls);

    return {
      content: body.message?.content ?? '',
      toolCalls,
    };
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const response = await this.post('/api/embed', {
      model: request.model,
      input: request.input,
    });

    if (!response.ok) {
      throw new ProviderRequestError(this.name, `HTTP ${response.status}`);
    }

    const body = (await response.json()) as OllamaEmbedResponseBody;
    return { embeddings: body.embeddings ?? [] };
  }

  async listModels(): Promise<string[]> {
    const response = await this.get('/api/tags');

    if (!response.ok) {
      throw new ProviderRequestError(this.name, `HTTP ${response.status}`);
    }

    const body = (await response.json()) as OllamaTagsResponseBody;
    return (body.models ?? []).map((model) => model.name);
  }

  async health(): Promise<boolean> {
    try {
      const response = await this.get('/api/tags');
      return response.ok;
    } catch {
      return false;
    }
  }

  private toOllamaMessage(message: ChatMessage): Record<string, unknown> {
    const mapped: Record<string, unknown> = {
      role: message.role,
      content: message.content,
    };

    if (
      message.role === 'assistant' &&
      message.toolCalls &&
      message.toolCalls.length > 0
    ) {
      mapped['tool_calls'] = message.toolCalls.map((call) => ({
        id: call.id,
        function: { name: call.name, arguments: call.arguments },
      }));
    }

    return mapped;
  }

  private toOllamaTools(
    tools: ToolDefinition[] | undefined
  ): Array<Record<string, unknown>> | undefined {
    if (!tools || tools.length === 0) {
      return undefined;
    }

    return tools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }

  private fromOllamaToolCalls(
    toolCalls: OllamaToolCall[] | undefined
  ): ToolCall[] | undefined {
    if (!toolCalls || toolCalls.length === 0) {
      return undefined;
    }

    return toolCalls.map((call) => ({
      id: call.id,
      name: call.function?.name ?? '',
      arguments: call.function?.arguments ?? {},
    }));
  }

  private async get(path: string): Promise<Response> {
    try {
      return await fetch(`${this.config.baseUrl}${path}`);
    } catch (error) {
      throw new ProviderUnavailableError(this.name, error);
    }
  }

  private async post(path: string, payload: unknown): Promise<Response> {
    try {
      return await fetch(`${this.config.baseUrl}${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      throw new ProviderUnavailableError(this.name, error);
    }
  }
}
