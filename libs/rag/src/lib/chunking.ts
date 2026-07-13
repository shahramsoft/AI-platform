export interface ChunkOptions {
  chunkSize?: number;
  overlap?: number;
}

const DEFAULT_CHUNK_SIZE = 500;
const DEFAULT_OVERLAP = 50;

export function chunkText(text: string, options: ChunkOptions = {}): string[] {
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const overlap = options.overlap ?? DEFAULT_OVERLAP;

  if (chunkSize <= 0) {
    throw new RangeError('chunkSize must be greater than 0');
  }
  if (overlap < 0 || overlap >= chunkSize) {
    throw new RangeError('overlap must be >= 0 and less than chunkSize');
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return [];
  }

  const chunks: string[] = [];
  const step = chunkSize - overlap;
  let start = 0;

  while (start < trimmed.length) {
    const end = Math.min(start + chunkSize, trimmed.length);
    chunks.push(trimmed.slice(start, end));

    if (end === trimmed.length) {
      break;
    }

    start += step;
  }

  return chunks;
}
