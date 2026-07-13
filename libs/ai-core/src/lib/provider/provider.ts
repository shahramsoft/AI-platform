import { ChatRequest, ChatResponse } from '../chat/chat.types';

export interface AIProvider {
  readonly name: string;

  chat(request: ChatRequest): Promise<ChatResponse>;

  listModels(): Promise<string[]>;

  health(): Promise<boolean>;
}
