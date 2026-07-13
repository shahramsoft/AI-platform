import { Tool, ToolResult } from './tool';
import { ToolNotFoundError } from './tool.errors';

export class ToolRuntime {
  private readonly tools = new Map<string, Tool>();

  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  list(): Tool[] {
    return [...this.tools.values()];
  }

  async execute(
    name: string,
    input: Record<string, unknown>
  ): Promise<ToolResult> {
    const tool = this.tools.get(name);

    if (!tool) {
      throw new ToolNotFoundError(name);
    }

    try {
      return await tool.execute(input);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
