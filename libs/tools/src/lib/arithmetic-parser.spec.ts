import { ArithmeticParser } from './arithmetic-parser';

function evaluate(expression: string): number {
  return new ArithmeticParser(expression).parse();
}

describe('ArithmeticParser', () => {
  it('evaluates simple addition', () => {
    expect(evaluate('2 + 3')).toBe(5);
  });

  it('respects operator precedence', () => {
    expect(evaluate('2 + 3 * 4')).toBe(14);
  });

  it('respects parentheses', () => {
    expect(evaluate('(2 + 3) * 4')).toBe(20);
  });

  it('handles decimals and negative numbers', () => {
    expect(evaluate('-2.5 + 5')).toBe(2.5);
  });

  it('handles nested parentheses', () => {
    expect(evaluate('((1 + 2) * (3 + 4))')).toBe(21);
  });

  it('throws on division by zero', () => {
    expect(() => evaluate('1 / 0')).toThrow(RangeError);
  });

  it('throws on malformed input', () => {
    expect(() => evaluate('2 + ')).toThrow(SyntaxError);
  });

  it('throws on trailing garbage', () => {
    expect(() => evaluate('2 + 2 foo')).toThrow(SyntaxError);
  });
});
