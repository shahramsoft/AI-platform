import { AIProvider, ChatMessage, ToolDefinition } from '@org/ai-core';
import { Tool, ToolRuntime } from '@org/tools';
import { AgentIterationLimitError } from './agent.errors';

export interface AgentStep {
  toolName: string;
  input: Record<string, unknown>;
  output: unknown;
}

export interface AgentRunResult {
  finalMessage: string;
  steps: AgentStep[];
}

const DEFAULT_MAX_ITERATIONS = 5;

export class AgentRuntime {
  constructor(
    private readonly provider: AIProvider,
    private readonly toolRuntime: ToolRuntime,
    private readonly maxIterations = DEFAULT_MAX_ITERATIONS
  ) {}

  async run(model: string, goal: string): Promise<AgentRunResult> {
    const tools = this.toDefinitions(this.toolRuntime.list());
    const messages: ChatMessage[] = [{ role: 'user', content: goal }];
    const steps: AgentStep[] = [];

    for (let iteration = 0; iteration < this.maxIterations; iteration++) {
      const response = await this.provider.chat({ model, messages, tools });

      if (!response.toolCalls || response.toolCalls.length === 0) {
        return { finalMessage: response.content, steps };
      }

      messages.push({
        role: 'assistant',
        content: response.content,
        toolCalls: response.toolCalls,
      });

      for (const call of response.toolCalls) {
        const result = await this.toolRuntime.execute(
          call.name,
          call.arguments
        );
        steps.push({
          toolName: call.name,
          input: call.arguments,
          output: result,
        });

        messages.push({
          role: 'tool',
          content: JSON.stringify(result),
          toolCalls: [call],
        });
      }
    }

    throw new AgentIterationLimitError(this.maxIterations);
  }

  private toDefinitions(tools: Tool[]): ToolDefinition[] {
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }));
  }
}
