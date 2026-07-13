import { ChatMessage } from '@org/ai-core';

const DEFAULT_MAX_MESSAGES = 50;

export class ConversationMemory {
  private readonly conversations = new Map<string, ChatMessage[]>();

  constructor(
    private readonly maxMessagesPerConversation = DEFAULT_MAX_MESSAGES
  ) {}

  append(conversationId: string, message: ChatMessage): void {
    const history = this.conversations.get(conversationId) ?? [];
    history.push(message);

    if (history.length > this.maxMessagesPerConversation) {
      history.splice(0, history.length - this.maxMessagesPerConversation);
    }

    this.conversations.set(conversationId, history);
  }

  getHistory(conversationId: string): ChatMessage[] {
    return [...(this.conversations.get(conversationId) ?? [])];
  }

  clear(conversationId: string): void {
    this.conversations.delete(conversationId);
  }
}
