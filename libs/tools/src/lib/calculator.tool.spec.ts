import { CalculatorTool } from './calculator.tool';

describe('CalculatorTool', () => {
  it('evaluates a valid expression', async () => {
    const tool = new CalculatorTool();

    const result = await tool.execute({ expression: '(2 + 3) * 4' });

    expect(result).toEqual({ success: true, output: 20 });
  });

  it('fails gracefully when expression is missing', async () => {
    const tool = new CalculatorTool();

    const result = await tool.execute({});

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/expression/);
  });

  it('fails gracefully on invalid expressions instead of throwing', async () => {
    const tool = new CalculatorTool();

    const result = await tool.execute({ expression: '1 / 0' });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/division/i);
  });
});
