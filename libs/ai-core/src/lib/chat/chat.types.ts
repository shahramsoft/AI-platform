export type Role = 'system' | 'user' | 'assistant' | 'tool';

export interface ToolCall {
  id?: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ChatMessage {
  role: Role;
  content: string;
  toolCalls?: ToolCall[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  tools?: ToolDefinition[];
}

export interface ChatResponse {
  content: string;
  toolCalls?: ToolCall[];
}
