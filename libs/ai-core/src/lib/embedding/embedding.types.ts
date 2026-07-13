export interface EmbeddingRequest {
  model: string;
  input: string[];
}

export interface EmbeddingResponse {
  embeddings: number[][];
}
