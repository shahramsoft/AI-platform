import {
  ProviderConfigurationError,
  ProviderRequestError,
  ProviderUnavailableError,
} from './provider.errors';

describe('provider errors', () => {
  it('formats ProviderUnavailableError with the provider name', () => {
    const error = new ProviderUnavailableError('ollama');

    expect(error.name).toBe('ProviderUnavailableError');
    expect(error.message).toBe('Provider "ollama" is unavailable.');
  });

  it('formats ProviderRequestError with the provider name and reason', () => {
    const error = new ProviderRequestError('openai', 'HTTP 500');

    expect(error.name).toBe('ProviderRequestError');
    expect(error.message).toBe('Provider "openai" request failed: HTTP 500');
  });

  it('formats ProviderConfigurationError with the provider name and reason', () => {
    const error = new ProviderConfigurationError('openai', 'missing API key');

    expect(error.name).toBe('ProviderConfigurationError');
    expect(error.message).toBe(
      'Provider "openai" is misconfigured: missing API key'
    );
  });

  it('preserves the original cause', () => {
    const cause = new Error('socket hang up');
    const error = new ProviderUnavailableError('ollama', cause);

    expect(error.cause).toBe(cause);
  });
});
