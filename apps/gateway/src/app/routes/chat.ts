import { FastifyInstance } from 'fastify';
import { z } from 'zod';

const chatRequestSchema = z.object({
  conversationId: z.string().min(1),
  message: z.string().min(1),
  model: z.string().optional(),
  ragEnabled: z.boolean().optional(),
});

export default async function (fastify: FastifyInstance) {
  fastify.post('/chat', async (request, reply) => {
    const parseResult = chatRequestSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Invalid request',
        details: parseResult.error.flatten(),
      });
    }

    const { conversationId, message, model, ragEnabled } = parseResult.data;
    const defaultModel = process.env['OLLAMA_DEFAULT_MODEL'] ?? 'qwen3:8b';

    try {
      const result = await fastify.chatService.send({
        conversationId,
        model: model ?? defaultModel,
        message,
        useRag: ragEnabled ?? false,
      });
      return reply.send(result);
    } catch (error) {
      request.log.error(error);
      return reply.status(502).send({ error: 'Upstream provider error' });
    }
  });
}
