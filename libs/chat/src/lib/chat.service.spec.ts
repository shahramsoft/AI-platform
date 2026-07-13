import { AIProvider, ChatRequest, ChatResponse } from '@org/ai-core';
import { ConversationMemory } from '@org/memory';
import { ChatService } from './chat.service';

class FakeProvider implements AIProvider {
  readonly name = 'fake';
  public receivedRequests: ChatRequest[] = [];

  constructor(private readonly reply: string) {}

  async chat(request: ChatRequest): Promise<ChatResponse> {
    this.receivedRequests.push(request);
    return { content: this.reply };
  }

  async embed() {
    return { embeddings: [] };
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
});
