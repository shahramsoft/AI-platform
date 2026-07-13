import { Tool, ToolResult } from './tool';
import { ToolNotFoundError } from './tool.errors';
import { ToolRuntime } from './tool-runtime';

class EchoTool implements Tool {
  readonly name = 'echo';
  readonly description = 'Echoes back its input.';
  readonly parameters = { type: 'object', properties: {} };

  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    return { success: true, output: input };
  }
}

class ExplodingTool implements Tool {
  readonly name = 'exploding';
  readonly description = 'Always throws.';
  readonly parameters = { type: 'object', properties: {} };

  async execute(): Promise<ToolResult> {
    throw new Error('boom');
  }
}

describe('ToolRuntime', () => {
  it('lists no tools before any are registered', () => {
    expect(new ToolRuntime().list()).toEqual([]);
  });

  it('registers and lists tools', () => {
    const runtime = new ToolRuntime();
    runtime.register(new EchoTool());

    expect(runtime.list().map((tool) => tool.name)).toEqual(['echo']);
  });

  it('executes a registered tool with the given input', async () => {
    const runtime = new ToolRuntime();
    runtime.register(new EchoTool());

    const result = await runtime.execute('echo', { value: 42 });

    expect(result).toEqual({ success: true, output: { value: 42 } });
  });

  it('throws ToolNotFoundError for an unregistered tool', async () => {
    const runtime = new ToolRuntime();

    await expect(runtime.execute('missing', {})).rejects.toBeInstanceOf(
      ToolNotFoundError
    );
  });

  it('converts a thrown error into a failed ToolResult instead of rejecting', async () => {
    const runtime = new ToolRuntime();
    runtime.register(new ExplodingTool());

    const result = await runtime.execute('exploding', {});

    expect(result).toEqual({ success: false, error: 'boom' });
  });
});
