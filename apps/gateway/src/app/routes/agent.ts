import { FastifyInstance } from 'fastify';
import { z } from 'zod';

const agentRequestSchema = z.object({
  goal: z.string().min(1),
  model: z.string().optional(),
});

export default async function (fastify: FastifyInstance) {
  fastify.post('/agent', async (request, reply) => {
    const parseResult = agentRequestSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Invalid request',
        details: parseResult.error.flatten(),
      });
    }

    const { goal, model } = parseResult.data;
    const defaultModel = process.env['OLLAMA_DEFAULT_MODEL'] ?? 'qwen3:8b';

    try {
      const result = await fastify.agentRuntime.run(
        model ?? defaultModel,
        goal
      );
      return reply.send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(502).send({ error: 'Agent execution failed' });
    }
  });
}
