import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { ChatService } from '@org/chat';
import { ConversationMemory } from '@org/memory';
import { ProviderFactory } from '@org/providers';

const envPath = resolve(process.cwd(), '.env');
if (existsSync(envPath)) {
  process.loadEnvFile(envPath);
}

function printUsage(): void {
  console.log(
    [
      'Usage:',
      '  ai chat <message> [--conversation <id>] [--model <name>]',
      '  ai models',
    ].join('\n')
  );
}

interface ChatArgs {
  message?: string;
  conversationId: string;
  model: string;
}

function parseChatArgs(args: string[]): ChatArgs {
  const flags: Record<string, string> = {};

  for (let i = 1; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];

    if (key?.startsWith('--') && value) {
      flags[key.slice(2)] = value;
    }
  }

  return {
    message: args[0],
    conversationId: flags['conversation'] ?? 'cli-session',
    model:
      flags['model'] ?? process.env['OLLAMA_DEFAULT_MODEL'] ?? 'qwen3:8b',
  };
}

async function runChat(args: string[]): Promise<void> {
  const { message, conversationId, model } = parseChatArgs(args);

  if (!message) {
    console.error('Error: a message is required.');
    printUsage();
    process.exitCode = 1;
    return;
  }

  const provider = ProviderFactory.fromEnv();
  const chatService = new ChatService(provider, new ConversationMemory());

  const result = await chatService.send({ conversationId, model, message });
  console.log(result.reply);
}

async function runModels(): Promise<void> {
  const provider = ProviderFactory.fromEnv();
  const models = await provider.listModels();
  models.forEach((model) => console.log(model));
}

async function main(): Promise<void> {
  const [, , command, ...rest] = process.argv;

  switch (command) {
    case 'chat':
      await runChat(rest);
      break;
    case 'models':
      await runModels();
      break;
    default:
      printUsage();
      process.exitCode = command ? 1 : 0;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
