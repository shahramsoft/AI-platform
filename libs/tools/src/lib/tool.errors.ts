export class ToolNotFoundError extends Error {
  constructor(toolName: string) {
    super(`Tool "${toolName}" is not registered.`);
    this.name = 'ToolNotFoundError';
  }
}
