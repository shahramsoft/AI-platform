import {
  AIProvider,
  ChatRequest,
  ChatResponse,
  ProviderRequestError,
  ProviderUnavailableError,
} from '@org/ai-core';

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';

export interface OpenAIProviderConfig {
  apiKey: string;
  baseUrl?: string;
}

interface OpenAIChatResponseBody {
  choices?: Array<{ message?: { content?: string } }>;
}

interface OpenAIModelsResponseBody {
  data?: Array<{ id: string }>;
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
        messages: request.messages,
      }),
    });

    if (!response.ok) {
      throw new ProviderRequestError(this.name, `HTTP ${response.status}`);
    }

    const body = (await response.json()) as OpenAIChatResponseBody;
    return { content: body.choices?.[0]?.message?.content ?? '' };
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

  private async request(path: string, init: RequestInit = {}): Promise<Response> {
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
