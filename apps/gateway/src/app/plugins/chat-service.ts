import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { ProviderFactory } from '@org/providers';
import { ConversationMemory } from '@org/memory';
import { ChatService } from '@org/chat';

declare module 'fastify' {
  interface FastifyInstance {
    chatService: ChatService;
  }
}

export default fp(async function (fastify: FastifyInstance) {
  const provider = ProviderFactory.fromEnv();
  const memory = new ConversationMemory();

  fastify.decorate('chatService', new ChatService(provider, memory));
});
