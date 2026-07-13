import { FastifyInstance } from 'fastify';
import { z } from 'zod';

const indexRequestSchema = z.object({
  documentId: z.string().min(1),
  text: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export default async function (fastify: FastifyInstance) {
  fastify.post('/rag/index', async (request, reply) => {
    const parseResult = indexRequestSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Invalid request',
        details: parseResult.error.flatten(),
      });
    }

    const { documentId, text, metadata } = parseResult.data;
    const embeddingModel =
      process.env['RAG_EMBEDDING_MODEL'] ?? 'nomic-embed-text:latest';

    try {
      const chunkCount = await fastify.ragService.indexDocument({
        documentId,
        text,
        model: embeddingModel,
        metadata,
      });
      return reply.send({ documentId, chunkCount });
    } catch (error) {
      request.log.error(error);
      return reply.status(502).send({ error: 'Indexing failed' });
    }
  });
}
