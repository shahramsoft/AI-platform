import { CurrentTimeTool } from './current-time.tool';

describe('CurrentTimeTool', () => {
  it('returns the current time as an ISO 8601 string', async () => {
    const tool = new CurrentTimeTool();
    const before = Date.now();

    const result = await tool.execute();

    const after = Date.now();
    expect(result.success).toBe(true);
    const parsed = Date.parse(result.output as string);
    expect(parsed).toBeGreaterThanOrEqual(before);
    expect(parsed).toBeLessThanOrEqual(after);
  });
});
