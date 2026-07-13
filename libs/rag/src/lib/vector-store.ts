export interface VectorRecord {
  id: string;
  vector: number[];
  text: string;
  metadata?: Record<string, unknown>;
}

export interface VectorSearchResult {
  id: string;
  text: string;
  score: number;
  metadata?: Record<string, unknown>;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class InMemoryVectorStore {
  private readonly records: VectorRecord[] = [];

  add(record: VectorRecord): void {
    this.records.push(record);
  }

  addMany(records: VectorRecord[]): void {
    for (const record of records) {
      this.add(record);
    }
  }

  search(queryVector: number[], topK = 5): VectorSearchResult[] {
    return this.records
      .map((record) => ({
        id: record.id,
        text: record.text,
        metadata: record.metadata,
        score: cosineSimilarity(queryVector, record.vector),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  clear(): void {
    this.records.length = 0;
  }

  get size(): number {
    return this.records.length;
  }
}
