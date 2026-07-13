import { AIProvider, ChatRequest, ChatResponse } from '@org/ai-core';
import { CalculatorTool, ToolRuntime } from '@org/tools';
import { AgentIterationLimitError } from './agent.errors';
import { AgentRuntime } from './agent-runtime';

class ScriptedProvider implements AIProvider {
  readonly name = 'scripted';
  public receivedRequests: ChatRequest[] = [];
  private callIndex = 0;

  constructor(private readonly responses: ChatResponse[]) {}

  async chat(request: ChatRequest): Promise<ChatResponse> {
    this.receivedRequests.push(request);
    const response = this.responses[this.callIndex];
    this.callIndex++;
    return response;
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

function newToolRuntime(): ToolRuntime {
  const toolRuntime = new ToolRuntime();
  toolRuntime.register(new CalculatorTool());
  return toolRuntime;
}

describe('AgentRuntime', () => {
  it('returns the final message directly when no tool is called', async () => {
    const provider = new ScriptedProvider([{ content: 'the answer is 42' }]);
    const runtime = new AgentRuntime(provider, newToolRuntime());

    const result = await runtime.run('qwen3:8b', 'what is the answer?');

    expect(result).toEqual({ finalMessage: 'the answer is 42', steps: [] });
  });

  it('advertises registered tools to the provider', async () => {
    const provider = new ScriptedProvider([{ content: 'ok' }]);
    const runtime = new AgentRuntime(provider, newToolRuntime());

    await runtime.run('qwen3:8b', 'goal');

    expect(provider.receivedRequests[0].tools).toEqual([
      expect.objectContaining({ name: 'calculator' }),
    ]);
  });

  it('executes a requested tool and feeds the result back for a final answer', async () => {
    const provider = new ScriptedProvider([
      {
        content: '',
        toolCalls: [
          { id: 'call_1', name: 'calculator', arguments: { expression: '2+2' } },
        ],
      },
      { content: 'the result is 4' },
    ]);
    const runtime = new AgentRuntime(provider, newToolRuntime());

    const result = await runtime.run('qwen3:8b', 'what is 2+2?');

    expect(result.finalMessage).toBe('the result is 4');
    expect(result.steps).toEqual([
      {
        toolName: 'calculator',
        input: { expression: '2+2' },
        output: { success: true, output: 4 },
      },
    ]);

    const secondRequestMessages = provider.receivedRequests[1].messages;
    expect(secondRequestMessages[1]).toEqual(
      expect.objectContaining({ role: 'assistant' })
    );
    expect(secondRequestMessages[2]).toEqual(
      expect.objectContaining({
        role: 'tool',
        content: JSON.stringify({ success: true, output: 4 }),
      })
    );
  });

  it('throws AgentIterationLimitError if the model never stops calling tools', async () => {
    const alwaysCallsTool: ChatResponse = {
      content: '',
      toolCalls: [
        { id: 'call_x', name: 'calculator', arguments: { expression: '1+1' } },
      ],
    };
    const provider = new ScriptedProvider([
      alwaysCallsTool,
      alwaysCallsTool,
      alwaysCallsTool,
    ]);
    const runtime = new AgentRuntime(provider, newToolRuntime(), 2);

    await expect(runtime.run('qwen3:8b', 'loop forever')).rejects.toBeInstanceOf(
      AgentIterationLimitError
    );
  });
});
