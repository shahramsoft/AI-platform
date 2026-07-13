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

  it('throws ProviderRequestError on a non-ok response', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 401 }));

    const provider = new OpenAIProvider({ apiKey: 'bad-key' });

    await expect(
      provider.chat({ model: 'gpt-4o-mini', messages: [] })
    ).rejects.toBeInstanceOf(ProviderRequestError);
  });
});
