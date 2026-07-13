export class AgentIterationLimitError extends Error {
  constructor(limit: number) {
    super(`Agent did not produce a final answer within ${limit} iterations.`);
    this.name = 'AgentIterationLimitError';
  }
}
