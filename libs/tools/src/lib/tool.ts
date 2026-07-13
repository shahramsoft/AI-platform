export interface ToolResult {
  success: boolean;
  output?: unknown;
  error?: string;
}

export interface Tool {
  readonly name: string;
  readonly description: string;
  readonly parameters: Record<string, unknown>;

  execute(input: Record<string, unknown>): Promise<ToolResult>;
}
