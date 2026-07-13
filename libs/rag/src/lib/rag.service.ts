import { AIProvider } from '@org/ai-core';
import { ChunkOptions, chunkText } from './chunking';
import { InMemoryVectorStore, VectorSearchResult } from './vector-store';

export interface IndexDocumentRequest {
  documentId: string;
  text: string;
  model: string;
  chunkOptions?: ChunkOptions;
  metadata?: Record<string, unknown>;
}

export interface RetrieveRequest {
  query: string;
  model: string;
  topK?: number;
}

export class RagService {
  constructor(
    private readonly provider: AIProvider,
    private readonly store: InMemoryVectorStore = new InMemoryVectorStore()
  ) {}

  async indexDocument(request: IndexDocumentRequest): Promise<number> {
    const chunks = chunkText(request.text, request.chunkOptions);

    if (chunks.length === 0) {
      return 0;
    }

    const { embeddings } = await this.provider.embed({
      model: request.model,
      input: chunks,
    });

    chunks.forEach((chunk, index) => {
      this.store.add({
        id: `${request.documentId}#${index}`,
        vector: embeddings[index],
        text: chunk,
        metadata: request.metadata,
      });
    });

    return chunks.length;
  }

  async retrieve(request: RetrieveRequest): Promise<VectorSearchResult[]> {
    const { embeddings } = await this.provider.embed({
      model: request.model,
      input: [request.query],
    });

    return this.store.search(embeddings[0], request.topK);
  }
}
