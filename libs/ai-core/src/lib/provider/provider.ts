import { ChatRequest, ChatResponse } from '../chat/chat.types';
import { EmbeddingRequest, EmbeddingResponse } from '../embedding/embedding.types';

export interface AIProvider {
  readonly name: string;

  chat(request: ChatRequest): Promise<ChatResponse>;

  embed(request: EmbeddingRequest): Promise<EmbeddingResponse>;

  listModels(): Promise<string[]>;

  health(): Promise<boolean>;
}
