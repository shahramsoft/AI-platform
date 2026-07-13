export class ProviderUnavailableError extends Error {
  constructor(providerName: string, cause?: unknown) {
    super(`Provider "${providerName}" is unavailable.`);
    this.name = 'ProviderUnavailableError';
    this.cause = cause;
  }
}

export class ProviderRequestError extends Error {
  constructor(providerName: string, reason: string, cause?: unknown) {
    super(`Provider "${providerName}" request failed: ${reason}`);
    this.name = 'ProviderRequestError';
    this.cause = cause;
  }
}

export class ProviderConfigurationError extends Error {
  constructor(providerName: string, reason: string) {
    super(`Provider "${providerName}" is misconfigured: ${reason}`);
    this.name = 'ProviderConfigurationError';
  }
}
