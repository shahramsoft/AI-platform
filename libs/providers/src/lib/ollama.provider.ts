import {
  AIProvider,
  ChatRequest,
  ChatResponse,
  ProviderRequestError,
  ProviderUnavailableError,
} from '@org/ai-core';

export interface OllamaProviderConfig {
  baseUrl: string;
}

interface OllamaChatResponseBody {
  message?: { content?: string };
}

interface OllamaTagsResponseBody {
  models?: Array<{ name: string }>;
}

export class OllamaProvider implements AIProvider {
  readonly name = 'ollama';

  constructor(private readonly config: OllamaProviderConfig) {}

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await this.post('/api/chat', {
      model: request.model,
      messages: request.messages,
      stream: false,
    });

    if (!response.ok) {
      throw new ProviderRequestError(this.name, `HTTP ${response.status}`);
    }

    const body = (await response.json()) as OllamaChatResponseBody;
    return { content: body.message?.content ?? '' };
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
