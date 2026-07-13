import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

const PUBLIC_PATHS = new Set(['/health']);

export default fp(async function (fastify: FastifyInstance) {
  const apiKey = process.env['GATEWAY_API_KEY'];

  if (!apiKey) {
    fastify.log.warn(
      'GATEWAY_API_KEY is not set; all gateway requests are unauthenticated.'
    );
    return;
  }

  fastify.addHook(
    'onRequest',
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (PUBLIC_PATHS.has(request.url)) {
        return;
      }

      if (request.headers['x-api-key'] !== apiKey) {
        reply.status(401).send({ error: 'Unauthorized' });
      }
    }
  );
});
