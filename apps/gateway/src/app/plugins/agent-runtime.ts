import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { ProviderFactory } from '@org/providers';
import { CalculatorTool, CurrentTimeTool, ToolRuntime } from '@org/tools';
import { AgentRuntime } from '@org/agents';

declare module 'fastify' {
  interface FastifyInstance {
    agentRuntime: AgentRuntime;
  }
}

export default fp(async function (fastify: FastifyInstance) {
  const provider = ProviderFactory.fromEnv();
  const toolRuntime = new ToolRuntime();
  toolRuntime.register(new CalculatorTool());
  toolRuntime.register(new CurrentTimeTool());

  fastify.decorate('agentRuntime', new AgentRuntime(provider, toolRuntime));
});
