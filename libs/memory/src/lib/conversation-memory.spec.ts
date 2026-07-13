import { ConversationMemory } from './conversation-memory';

describe('ConversationMemory', () => {
  it('returns an empty history for an unknown conversation', () => {
    const memory = new ConversationMemory();

    expect(memory.getHistory('unknown')).toEqual([]);
  });

  it('appends messages in order for a conversation', () => {
    const memory = new ConversationMemory();

    memory.append('c1', { role: 'user', content: 'hi' });
    memory.append('c1', { role: 'assistant', content: 'hello' });

    expect(memory.getHistory('c1')).toEqual([
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
    ]);
  });

  it('keeps conversations isolated from each other', () => {
    const memory = new ConversationMemory();

    memory.append('c1', { role: 'user', content: 'from c1' });
    memory.append('c2', { role: 'user', content: 'from c2' });

    expect(memory.getHistory('c1')).toEqual([
      { role: 'user', content: 'from c1' },
    ]);
    expect(memory.getHistory('c2')).toEqual([
      { role: 'user', content: 'from c2' },
    ]);
  });

  it('trims the oldest messages beyond the configured limit', () => {
    const memory = new ConversationMemory(2);

    memory.append('c1', { role: 'user', content: 'first' });
    memory.append('c1', { role: 'assistant', content: 'second' });
    memory.append('c1', { role: 'user', content: 'third' });

    expect(memory.getHistory('c1')).toEqual([
      { role: 'assistant', content: 'second' },
      { role: 'user', content: 'third' },
    ]);
  });

  it('clears a conversation', () => {
    const memory = new ConversationMemory();

    memory.append('c1', { role: 'user', content: 'hi' });
    memory.clear('c1');

    expect(memory.getHistory('c1')).toEqual([]);
  });

  it('returns a defensive copy of the history', () => {
    const memory = new ConversationMemory();
    memory.append('c1', { role: 'user', content: 'hi' });

    const history = memory.getHistory('c1');
    history.push({ role: 'assistant', content: 'mutated' });

    expect(memory.getHistory('c1')).toEqual([
      { role: 'user', content: 'hi' },
    ]);
  });
});
