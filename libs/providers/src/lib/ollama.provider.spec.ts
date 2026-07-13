import { ProviderRequestError, ProviderUnavailableError } from '@org/ai-core';
import { OllamaProvider } from './ollama.provider';

describe('OllamaProvider', () => {
  const baseUrl = 'http://10.10.10.40:11434';
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('sends a non-streaming chat request and returns the reply content', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: { content: 'hello' } }), {
        status: 200,
      })
    );

    const provider = new OllamaProvider({ baseUrl });
    const result = await provider.chat({
      model: 'qwen3:8b',
      messages: [{ role: 'user', content: 'hi' }],
    });

    expect(result).toEqual({ content: 'hello' });
    expect(fetchMock).toHaveBeenCalledWith(
      `${baseUrl}/api/chat`,
      expect.objectContaining({ method: 'POST' })
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.stream).toBe(false);
  });

  it('throws ProviderRequestError on a non-ok chat response', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 500 }));

    const provider = new OllamaProvider({ baseUrl });

    await expect(
      provider.chat({ model: 'qwen3:8b', messages: [] })
    ).rejects.toBeInstanceOf(ProviderRequestError);
  });

  it('lists model names from /api/tags', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ models: [{ name: 'qwen3:8b' }, { name: 'deepseek-r1:8b' }] }),
        { status: 200 }
      )
    );

    const provider = new OllamaProvider({ baseUrl });
    const models = await provider.listModels();

    expect(models).toEqual(['qwen3:8b', 'deepseek-r1:8b']);
  });

  it('sends tool definitions and parses returned tool calls', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          message: {
            content: '',
            tool_calls: [
              {
                id: 'call_1',
                function: { name: 'calculator', arguments: { expression: '2+2' } },
              },
            ],
          },
        }),
        { status: 200 }
      )
    );

    const provider = new OllamaProvider({ baseUrl });
    const result = await provider.chat({
      model: 'qwen3:8b',
      messages: [{ role: 'user', content: 'what is 2+2?' }],
      tools: [
        {
          name: 'calculator',
          description: 'Evaluates arithmetic',
          parameters: { type: 'object', properties: {} },
        },
      ],
    });

    expect(result).toEqual({
      content: '',
      toolCalls: [
        { id: 'call_1', name: 'calculator', arguments: { expression: '2+2' } },
      ],
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.tools).toEqual([
      {
        type: 'function',
        function: {
          name: 'calculator',
          description: 'Evaluates arithmetic',
          parameters: { type: 'object', properties: {} },
        },
      },
    ]);
  });

  it('includes prior tool calls and tool results when replaying history', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: { content: 'done' } }), {
        status: 200,
      })
    );

    const provider = new OllamaProvider({ baseUrl });
    await provider.chat({
      model: 'qwen3:8b',
      messages: [
        { role: 'user', content: 'what is 2+2?' },
        {
          role: 'assistant',
          content: '',
          toolCalls: [
            { id: 'call_1', name: 'calculator', arguments: { expression: '2+2' } },
          ],
        },
        { role: 'tool', content: '4' },
      ],
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.messages[1].tool_calls).toEqual([
      { id: 'call_1', function: { name: 'calculator', arguments: { expression: '2+2' } } },
    ]);
    expect(body.messages[2]).toEqual({ role: 'tool', content: '4' });
  });

  it('embeds text via /api/embed', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ embeddings: [[0.1, 0.2, 0.3]] }), {
        status: 200,
      })
    );

    const provider = new OllamaProvider({ baseUrl });
    const result = await provider.embed({
      model: 'nomic-embed-text:latest',
      input: ['hello world'],
    });

    expect(result).toEqual({ embeddings: [[0.1, 0.2, 0.3]] });
    expect(fetchMock).toHaveBeenCalledWith(
      `${baseUrl}/api/embed`,
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('reports unhealthy when the request fails outright', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const provider = new OllamaProvider({ baseUrl });

    await expect(provider.health()).resolves.toBe(false);
  });

  it('wraps network failures in ProviderUnavailableError', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));

    const provider = new OllamaProvider({ baseUrl });

    await expect(
      provider.chat({ model: 'qwen3:8b', messages: [] })
    ).rejects.toBeInstanceOf(ProviderUnavailableError);
  });
});
