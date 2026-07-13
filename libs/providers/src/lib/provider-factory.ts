import { AIProvider, ProviderConfigurationError } from '@org/ai-core';
import { OllamaProvider } from './ollama.provider';
import { OpenAIProvider } from './openai.provider';

export type ProviderName = 'ollama' | 'openai';

export interface ProviderFactoryConfig {
  provider: ProviderName;
  ollama?: {
    baseUrl: string;
  };
  openai?: {
    apiKey: string;
    baseUrl?: string;
  };
}

export class ProviderFactory {
  static create(config: ProviderFactoryConfig): AIProvider {
    switch (config.provider) {
      case 'ollama': {
        if (!config.ollama) {
          throw new ProviderConfigurationError('ollama', 'missing baseUrl');
        }
        return new OllamaProvider(config.ollama);
      }
      case 'openai': {
        if (!config.openai) {
          throw new ProviderConfigurationError('openai', 'missing apiKey');
        }
        return new OpenAIProvider(config.openai);
      }
    }
  }

  static fromEnv(env: NodeJS.ProcessEnv = process.env): AIProvider {
    const provider = (env['AI_PROVIDER'] ?? 'ollama') as ProviderName;
    const openaiApiKey = env['OPENAI_API_KEY'];

    return ProviderFactory.create({
      provider,
      ollama: {
        baseUrl: env['OLLAMA_BASE_URL'] ?? 'http://localhost:11434',
      },
      openai: openaiApiKey
        ? { apiKey: openaiApiKey, baseUrl: env['OPENAI_BASE_URL'] }
        : undefined,
    });
  }
}
