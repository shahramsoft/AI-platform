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

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';

export interface OpenAIProviderConfig {
  apiKey: string;
  baseUrl?: string;
}

interface OpenAIToolCall {
  id?: string;
  function?: { name?: string; arguments?: string };
}

interface OpenAIChatResponseBody {
  choices?: Array<{
    message?: { content?: string; tool_calls?: OpenAIToolCall[] };
  }>;
}

interface OpenAIModelsResponseBody {
  data?: Array<{ id: string }>;
}

interface OpenAIEmbeddingResponseBody {
  data?: Array<{ embedding: number[] }>;
}

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  private readonly baseUrl: string;

  constructor(private readonly config: OpenAIProviderConfig) {
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await this.request('/chat/completions', {
      method: 'POST',
      body: JSON.stringify({
        model: request.model,
        messages: request.messages.map((message) =>
          this.toOpenAIMessage(message)
        ),
        tools: this.toOpenAITools(request.tools),
      }),
    });

    if (!response.ok) {
      throw new ProviderRequestError(this.name, `HTTP ${response.status}`);
    }

    const body = (await response.json()) as OpenAIChatResponseBody;
    const message = body.choices?.[0]?.message;

    return {
      content: message?.content ?? '',
      toolCalls: this.fromOpenAIToolCalls(message?.tool_calls),
    };
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const response = await this.request('/embeddings', {
      method: 'POST',
      body: JSON.stringify({ model: request.model, input: request.input }),
    });

    if (!response.ok) {
      throw new ProviderRequestError(this.name, `HTTP ${response.status}`);
    }

    const body = (await response.json()) as OpenAIEmbeddingResponseBody;
    return { embeddings: (body.data ?? []).map((item) => item.embedding) };
  }

  async listModels(): Promise<string[]> {
    const response = await this.request('/models');

    if (!response.ok) {
      throw new ProviderRequestError(this.name, `HTTP ${response.status}`);
    }

    const body = (await response.json()) as OpenAIModelsResponseBody;
    return (body.data ?? []).map((model) => model.id);
  }

  async health(): Promise<boolean> {
    try {
      const response = await this.request('/models');
      return response.ok;
    } catch {
      return false;
    }
  }

  private toOpenAIMessage(message: ChatMessage): Record<string, unknown> {
    const mapped: Record<string, unknown> = {
      role: message.role,
      content: message.content,
    };

    if (message.role === 'tool' && message.toolCalls?.[0]?.id) {
      mapped['tool_call_id'] = message.toolCalls[0].id;
    }

    if (message.toolCalls && message.toolCalls.length > 0 && message.role !== 'tool') {
      mapped['tool_calls'] = message.toolCalls.map((call) => ({
        id: call.id,
        type: 'function',
        function: {
          name: call.name,
          arguments: JSON.stringify(call.arguments),
        },
      }));
    }

    return mapped;
  }

  private toOpenAITools(
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

  private fromOpenAIToolCalls(
    toolCalls: OpenAIToolCall[] | undefined
  ): ToolCall[] | undefined {
    if (!toolCalls || toolCalls.length === 0) {
      return undefined;
    }

    return toolCalls.map((call) => {
      let parsedArguments: Record<string, unknown> = {};

      try {
        parsedArguments = call.function?.arguments
          ? JSON.parse(call.function.arguments)
          : {};
      } catch {
        parsedArguments = {};
      }

      return {
        id: call.id,
        name: call.function?.name ?? '',
        arguments: parsedArguments,
      };
    });
  }

  private async request(
    path: string,
    init: RequestInit = {}
  ): Promise<Response> {
    try {
      return await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${this.config.apiKey}`,
          ...init.headers,
        },
      });
    } catch (error) {
      throw new ProviderUnavailableError(this.name, error);
    }
  }
}
