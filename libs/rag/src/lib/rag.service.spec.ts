import { AIProvider, EmbeddingRequest, EmbeddingResponse } from '@org/ai-core';
import { RagService } from './rag.service';

class FakeEmbeddingProvider implements AIProvider {
  readonly name = 'fake';
  public receivedRequests: EmbeddingRequest[] = [];

  constructor(private readonly vectorFor: (text: string) => number[]) {}

  async chat() {
    return { content: '' };
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    this.receivedRequests.push(request);
    return { embeddings: request.input.map((text) => this.vectorFor(text)) };
  }

  async listModels(): Promise<string[]> {
    return [];
  }

  async health(): Promise<boolean> {
    return true;
  }
}

function wordCountVector(text: string): number[] {
  return [text.split(/\s+/).length, text.length];
}

describe('RagService', () => {
  it('indexes a document as one or more chunks and reports the chunk count', async () => {
    const provider = new FakeEmbeddingProvider(wordCountVector);
    const service = new RagService(provider);

    const chunkCount = await service.indexDocument({
      documentId: 'doc-1',
      text: 'hello world',
      model: 'nomic-embed-text:latest',
      chunkOptions: { chunkSize: 100 },
    });

    expect(chunkCount).toBe(1);
    expect(provider.receivedRequests[0].input).toEqual(['hello world']);
  });

  it('does nothing for blank documents', async () => {
    const provider = new FakeEmbeddingProvider(wordCountVector);
    const service = new RagService(provider);

    const chunkCount = await service.indexDocument({
      documentId: 'doc-1',
      text: '   ',
      model: 'nomic-embed-text:latest',
    });

    expect(chunkCount).toBe(0);
    expect(provider.receivedRequests).toHaveLength(0);
  });

  it('retrieves the most relevant indexed chunk for a query', async () => {
    const provider = new FakeEmbeddingProvider((text) =>
      text.includes('cat') ? [1, 0] : [0, 1]
    );
    const service = new RagService(provider);

    await service.indexDocument({
      documentId: 'doc-1',
      text: 'the cat sat on the mat',
      model: 'nomic-embed-text:latest',
      chunkOptions: { chunkSize: 100 },
    });
    await service.indexDocument({
      documentId: 'doc-2',
      text: 'stocks rallied on strong earnings',
      model: 'nomic-embed-text:latest',
      chunkOptions: { chunkSize: 100 },
    });

    const results = await service.retrieve({
      query: 'tell me about the cat',
      model: 'nomic-embed-text:latest',
      topK: 1,
    });

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('doc-1#0');
  });

  it('attaches metadata to indexed chunks', async () => {
    const provider = new FakeEmbeddingProvider(wordCountVector);
    const service = new RagService(provider);

    await service.indexDocument({
      documentId: 'doc-1',
      text: 'hello world',
      model: 'nomic-embed-text:latest',
      chunkOptions: { chunkSize: 100 },
      metadata: { source: 'readme.md' },
    });

    const results = await service.retrieve({
      query: 'hello',
      model: 'nomic-embed-text:latest',
    });

    expect(results[0].metadata).toEqual({ source: 'readme.md' });
  });
});
