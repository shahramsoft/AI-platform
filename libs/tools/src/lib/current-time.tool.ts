import { Tool, ToolResult } from './tool';

export class CurrentTimeTool implements Tool {
  readonly name = 'current-time';
  readonly description = 'Returns the current date and time in ISO 8601 format.';
  readonly parameters = { type: 'object', properties: {} };

  async execute(): Promise<ToolResult> {
    return { success: true, output: new Date().toISOString() };
  }
}
