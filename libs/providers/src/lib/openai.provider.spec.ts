import { ProviderRequestError } from '@org/ai-core';
import { OpenAIProvider } from './openai.provider';

describe('OpenAIProvider', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('sends a chat completion request with a bearer token', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ choices: [{ message: { content: 'hello' } }] }),
        { status: 200 }
      )
    );

    const provider = new OpenAIProvider({ apiKey: 'sk-test' });
    const result = await provider.chat({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'hi' }],
    });

    expect(result).toEqual({ content: 'hello' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    expect(init.headers.authorization).toBe('Bearer sk-test');
  });

  it('honors a custom baseUrl for OpenAI-compatible servers', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 }));

    const provider = new OpenAIProvider({
      apiKey: 'sk-test',
      baseUrl: 'http://10.10.10.40:8000/v1',
    });
    await provider.listModels();

    expect(fetchMock).toHaveBeenCalledWith(
      'http://10.10.10.40:8000/v1/models',
      expect.anything()
    );
  });

  it('sends tool definitions and parses stringified tool call arguments', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: '',
                tool_calls: [
                  {
                    id: 'call_1',
                    function: {
                      name: 'calculator',
                      arguments: '{"expression":"2+2"}',
                    },
                  },
                ],
              },
            },
          ],
        }),
        { status: 200 }
      )
    );

    const provider = new OpenAIProvider({ apiKey: 'sk-test' });
    const result = await provider.chat({
      model: 'gpt-4o-mini',
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
    expect(body.tools[0].function.name).toBe('calculator');
  });

  it('sends the tool_call_id on tool result messages', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ choices: [{ message: { content: 'done' } }] }),
        { status: 200 }
      )
    );

    const provider = new OpenAIProvider({ apiKey: 'sk-test' });
    await provider.chat({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: 'what is 2+2?' },
        {
          role: 'assistant',
          content: '',
          toolCalls: [
            { id: 'call_1', name: 'calculator', arguments: { expression: '2+2' } },
          ],
        },
        {
          role: 'tool',
          content: '4',
          toolCalls: [{ id: 'call_1', name: 'calculator', arguments: {} }],
        },
      ],
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.messages[1].tool_calls[0].function.arguments).toBe(
      '{"expression":"2+2"}'
    );
    expect(body.messages[2].tool_call_id).toBe('call_1');
  });

  it('embeds text via /embeddings', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: [{ embedding: [0.1, 0.2] }] }), {
        status: 200,
      })
    );

    const provider = new OpenAIProvider({ apiKey: 'sk-test' });
    const result = await provider.embed({
      model: 'text-embedding-3-small',
      input: ['hello world'],
    });

    expect(result).toEqual({ embeddings: [[0.1, 0.2]] });
  });

  it('throws ProviderRequestError on a non-ok response', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 401 }));

    const provider = new OpenAIProvider({ apiKey: 'bad-key' });

    await expect(
      provider.chat({ model: 'gpt-4o-mini', messages: [] })
    ).rejects.toBeInstanceOf(ProviderRequestError);
  });
});
