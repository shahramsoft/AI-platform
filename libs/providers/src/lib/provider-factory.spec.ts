import { ProviderConfigurationError } from '@org/ai-core';
import { OllamaProvider } from './ollama.provider';
import { OpenAIProvider } from './openai.provider';
import { ProviderFactory } from './provider-factory';

describe('ProviderFactory', () => {
  it('creates an OllamaProvider for the ollama config', () => {
    const provider = ProviderFactory.create({
      provider: 'ollama',
      ollama: { baseUrl: 'http://10.10.10.40:11434' },
    });

    expect(provider).toBeInstanceOf(OllamaProvider);
  });

  it('creates an OpenAIProvider for the openai config', () => {
    const provider = ProviderFactory.create({
      provider: 'openai',
      openai: { apiKey: 'sk-test' },
    });

    expect(provider).toBeInstanceOf(OpenAIProvider);
  });

  it('throws ProviderConfigurationError when ollama config is missing', () => {
    expect(() => ProviderFactory.create({ provider: 'ollama' })).toThrow(
      ProviderConfigurationError
    );
  });

  it('throws ProviderConfigurationError when openai config is missing', () => {
    expect(() => ProviderFactory.create({ provider: 'openai' })).toThrow(
      ProviderConfigurationError
    );
  });

  it('builds the default ollama provider from environment variables', () => {
    const provider = ProviderFactory.fromEnv({
      OLLAMA_BASE_URL: 'http://10.10.10.40:11434',
    } as NodeJS.ProcessEnv);

    expect(provider).toBeInstanceOf(OllamaProvider);
  });

  it('builds an openai provider from environment variables when selected', () => {
    const provider = ProviderFactory.fromEnv({
      AI_PROVIDER: 'openai',
      OPENAI_API_KEY: 'sk-test',
    } as NodeJS.ProcessEnv);

    expect(provider).toBeInstanceOf(OpenAIProvider);
  });
});
