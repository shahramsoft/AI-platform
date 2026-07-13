import {
  AIProvider,
  ChatRequest,
  ChatResponse,
  EmbeddingRequest,
  EmbeddingResponse,
} from '@org/ai-core';
import { ConversationMemory } from '@org/memory';
import { RagService } from '@org/rag';
import { ChatService } from './chat.service';

class FakeProvider implements AIProvider {
  readonly name = 'fake';
  public receivedRequests: ChatRequest[] = [];

  constructor(
    private readonly reply: string,
    private readonly vectorFor: (text: string) => number[] = () => [1]
  ) {}

  async chat(request: ChatRequest): Promise<ChatResponse> {
    this.receivedRequests.push(request);
    return { content: this.reply };
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    return { embeddings: request.input.map((text) => this.vectorFor(text)) };
  }

  async listModels(): Promise<string[]> {
    return [];
  }

  async health(): Promise<boolean> {
    return true;
  }
}

describe('ChatService', () => {
  it('sends the full conversation history to the provider and returns the reply', async () => {
    const provider = new FakeProvider('hello there');
    const memory = new ConversationMemory();
    const service = new ChatService(provider, memory);

    const result = await service.send({
      conversationId: 'c1',
      model: 'qwen3:8b',
      message: 'hi',
    });

    expect(result).toEqual({ conversationId: 'c1', reply: 'hello there' });
    expect(provider.receivedRequests[0]).toEqual({
      model: 'qwen3:8b',
      messages: [{ role: 'user', content: 'hi' }],
    });
  });

  it('persists both the user message and the reply in memory', async () => {
    const provider = new FakeProvider('reply one');
    const memory = new ConversationMemory();
    const service = new ChatService(provider, memory);

    await service.send({ conversationId: 'c1', model: 'qwen3:8b', message: 'first' });

    expect(memory.getHistory('c1')).toEqual([
      { role: 'user', content: 'first' },
      { role: 'assistant', content: 'reply one' },
    ]);
  });

  it('includes prior turns as context on the next message', async () => {
    const provider = new FakeProvider('second reply');
    const memory = new ConversationMemory();
    const service = new ChatService(provider, memory);

    await service.send({ conversationId: 'c1', model: 'qwen3:8b', message: 'first' });
    await service.send({ conversationId: 'c1', model: 'qwen3:8b', message: 'second' });

    expect(provider.receivedRequests[1].messages).toEqual([
      { role: 'user', content: 'first' },
      { role: 'assistant', content: expect.any(String) },
      { role: 'user', content: 'second' },
    ]);
  });

  it('keeps separate conversations independent', async () => {
    const provider = new FakeProvider('reply');
    const memory = new ConversationMemory();
    const service = new ChatService(provider, memory);

    await service.send({ conversationId: 'a', model: 'qwen3:8b', message: 'from a' });
    await service.send({ conversationId: 'b', model: 'qwen3:8b', message: 'from b' });

    expect(memory.getHistory('a')).toHaveLength(2);
    expect(memory.getHistory('b')).toHaveLength(2);
    expect(memory.getHistory('a')[0].content).toBe('from a');
    expect(memory.getHistory('b')[0].content).toBe('from b');
  });

  it('injects retrieved context as a system message when useRag is true', async () => {
    const provider = new FakeProvider('the cat sat on the mat, per the docs', (text) =>
      text.includes('cat') ? [1, 0] : [0, 1]
    );
    const memory = new ConversationMemory();
    const rag = new RagService(provider);
    await rag.indexDocument({
      documentId: 'doc-1',
      text: 'the cat sat on the mat',
      model: 'embed-model',
      chunkOptions: { chunkSize: 100 },
    });

    const service = new ChatService(provider, memory, rag, 'embed-model');
    await service.send({
      conversationId: 'c1',
      model: 'qwen3:8b',
      message: 'tell me about the cat',
      useRag: true,
    });

    const sentMessages = provider.receivedRequests[0].messages;
    expect(sentMessages[0]).toEqual(
      expect.objectContaining({
        role: 'system',
        content: expect.stringContaining('the cat sat on the mat'),
      })
    );
    expect(sentMessages[1]).toEqual({
      role: 'user',
      content: 'tell me about the cat',
    });
  });

  it('does not inject context when useRag is false', async () => {
    const provider = new FakeProvider('answer');
    const memory = new ConversationMemory();
    const rag = new RagService(provider);
    await rag.indexDocument({
      documentId: 'doc-1',
      text: 'irrelevant but indexed',
      model: 'embed-model',
      chunkOptions: { chunkSize: 100 },
    });

    const service = new ChatService(provider, memory, rag, 'embed-model');
    await service.send({ conversationId: 'c1', model: 'qwen3:8b', message: 'hi' });

    expect(provider.receivedRequests[0].messages).toEqual([
      { role: 'user', content: 'hi' },
    ]);
  });

  it('does not inject context when no RagService is configured', async () => {
    const provider = new FakeProvider('answer');
    const memory = new ConversationMemory();
    const service = new ChatService(provider, memory);

    await service.send({
      conversationId: 'c1',
      model: 'qwen3:8b',
      message: 'hi',
      useRag: true,
    });

    expect(provider.receivedRequests[0].messages).toEqual([
      { role: 'user', content: 'hi' },
    ]);
  });
});
