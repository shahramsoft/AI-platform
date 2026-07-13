import { ArithmeticParser } from './arithmetic-parser';
import { Tool, ToolResult } from './tool';

export class CalculatorTool implements Tool {
  readonly name = 'calculator';
  readonly description =
    'Evaluates a basic arithmetic expression (+, -, *, /, parentheses).';
  readonly parameters = {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'Arithmetic expression to evaluate, e.g. "(2 + 3) * 4"',
      },
    },
    required: ['expression'],
  };

  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    const expression = input['expression'];

    if (typeof expression !== 'string' || expression.trim().length === 0) {
      return {
        success: false,
        error: 'Input must include a non-empty "expression" string.',
      };
    }

    try {
      const result = new ArithmeticParser(expression).parse();
      return { success: true, output: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
