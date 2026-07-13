import { chunkText } from './chunking';

describe('chunkText', () => {
  it('returns an empty array for blank input', () => {
    expect(chunkText('   ')).toEqual([]);
  });

  it('returns a single chunk when text fits within chunkSize', () => {
    expect(chunkText('hello world', { chunkSize: 100 })).toEqual([
      'hello world',
    ]);
  });

  it('splits long text into overlapping chunks', () => {
    const text = 'a'.repeat(25);

    const chunks = chunkText(text, { chunkSize: 10, overlap: 2 });

    expect(chunks).toEqual(['a'.repeat(10), 'a'.repeat(10), 'a'.repeat(9)]);
  });

  it('trims surrounding whitespace before chunking', () => {
    expect(chunkText('  hi  ', { chunkSize: 10, overlap: 0 })).toEqual([
      'hi',
    ]);
  });

  it('throws for a non-positive chunkSize', () => {
    expect(() => chunkText('hi', { chunkSize: 0 })).toThrow(RangeError);
  });

  it('throws when overlap is not smaller than chunkSize', () => {
    expect(() => chunkText('hi', { chunkSize: 5, overlap: 5 })).toThrow(
      RangeError
    );
  });
});
