export class ArithmeticParser {
  private position = 0;

  constructor(private readonly expression: string) {}

  parse(): number {
    const value = this.parseExpression();
    this.skipWhitespace();

    if (this.position !== this.expression.length) {
      throw new SyntaxError(
        `Unexpected character at position ${this.position}`
      );
    }

    return value;
  }

  private parseExpression(): number {
    let value = this.parseTerm();

    for (;;) {
      this.skipWhitespace();
      const op = this.expression[this.position];

      if (op === '+' || op === '-') {
        this.position++;
        const rhs = this.parseTerm();
        value = op === '+' ? value + rhs : value - rhs;
      } else {
        return value;
      }
    }
  }

  private parseTerm(): number {
    let value = this.parseFactor();

    for (;;) {
      this.skipWhitespace();
      const op = this.expression[this.position];

      if (op === '*' || op === '/') {
        this.position++;
        const rhs = this.parseFactor();

        if (op === '/' && rhs === 0) {
          throw new RangeError('Division by zero');
        }

        value = op === '*' ? value * rhs : value / rhs;
      } else {
        return value;
      }
    }
  }

  private parseFactor(): number {
    this.skipWhitespace();

    if (this.expression[this.position] === '(') {
      this.position++;
      const value = this.parseExpression();
      this.skipWhitespace();

      if (this.expression[this.position] !== ')') {
        throw new SyntaxError('Expected closing parenthesis');
      }

      this.position++;
      return value;
    }

    const start = this.position;

    if (this.expression[this.position] === '-') {
      this.position++;
    }

    while (/[0-9.]/.test(this.expression[this.position] ?? '')) {
      this.position++;
    }

    const raw = this.expression.slice(start, this.position);

    if (raw.length === 0 || raw === '-') {
      throw new SyntaxError(`Expected a number at position ${start}`);
    }

    return Number(raw);
  }

  private skipWhitespace(): void {
    while (this.expression[this.position] === ' ') {
      this.position++;
    }
  }
}
