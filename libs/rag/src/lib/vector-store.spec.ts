import { InMemoryVectorStore } from './vector-store';

describe('InMemoryVectorStore', () => {
  it('starts empty', () => {
    const store = new InMemoryVectorStore();

    expect(store.size).toBe(0);
    expect(store.search([1, 0])).toEqual([]);
  });

  it('ranks results by cosine similarity, most similar first', () => {
    const store = new InMemoryVectorStore();

    store.add({ id: 'a', text: 'points along x', vector: [1, 0] });
    store.add({ id: 'b', text: 'points along y', vector: [0, 1] });
    store.add({ id: 'c', text: 'diagonal', vector: [1, 1] });

    const results = store.search([1, 0], 3);

    expect(results.map((r) => r.id)).toEqual(['a', 'c', 'b']);
    expect(results[0].score).toBeCloseTo(1);
    expect(results[2].score).toBeCloseTo(0);
  });

  it('respects topK', () => {
    const store = new InMemoryVectorStore();
    store.addMany([
      { id: 'a', text: 'a', vector: [1, 0] },
      { id: 'b', text: 'b', vector: [0.9, 0.1] },
      { id: 'c', text: 'c', vector: [0, 1] },
    ]);

    expect(store.search([1, 0], 1)).toHaveLength(1);
  });

  it('carries metadata through search results', () => {
    const store = new InMemoryVectorStore();
    store.add({ id: 'a', text: 'a', vector: [1, 0], metadata: { source: 'doc-1' } });

    expect(store.search([1, 0])[0].metadata).toEqual({ source: 'doc-1' });
  });

  it('treats a zero vector as having zero similarity to anything', () => {
    const store = new InMemoryVectorStore();
    store.add({ id: 'a', text: 'a', vector: [0, 0] });

    expect(store.search([1, 0])[0].score).toBe(0);
  });

  it('clears all records', () => {
    const store = new InMemoryVectorStore();
    store.add({ id: 'a', text: 'a', vector: [1, 0] });

    store.clear();

    expect(store.size).toBe(0);
  });
});
