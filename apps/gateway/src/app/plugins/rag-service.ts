import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { ProviderFactory } from '@org/providers';
import { RagService } from '@org/rag';

declare module 'fastify' {
  interface FastifyInstance {
    ragService: RagService;
  }
}

export default fp(
  async function (fastify: FastifyInstance) {
    const provider = ProviderFactory.fromEnv();
    fastify.decorate('ragService', new RagService(provider));
  },
  { name: 'rag-service' }
);
