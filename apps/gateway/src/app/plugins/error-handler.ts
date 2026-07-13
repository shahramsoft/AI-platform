import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

export default fp(async function (fastify: FastifyInstance) {
  fastify.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, 'unhandled request error');

    const statusCode = error.statusCode ?? 500;

    reply.status(statusCode).send({
      error: statusCode === 500 ? 'Internal Server Error' : error.message,
    });
  });
});
