import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer } from '../../src/lib/mcp/server';

/**
 * Connects the real SDK client to the real server over a linked in-memory pair.
 *
 * Calling the handlers directly would not exercise the registration, the
 * declared input schema or the tool-error framing, which is where this feature
 * can actually break.
 */
export const connect = async (): Promise<Client> => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = await createMcpServer();

  await server.connect(serverTransport);

  const client = new Client({ name: 'test-client', version: '1.0.0' });
  await client.connect(clientTransport);

  return client;
};

interface ToolResult {
  isError?: boolean;
  structuredContent?: unknown;
  content?: Array<{ type: string; text?: string }>;
}

/** Closes the client after use, so a test never abandons an open connection. */
const withClient = async <T>(use: (client: Client) => Promise<T>): Promise<T> => {
  const client = await connect();

  try {
    return await use(client);
  } finally {
    await client.close().catch(() => undefined);
  }
};

/** Returns the structured payload, or throws with the tool's own message. */
export const callTool = async <T>(
  name: string,
  args: Record<string, unknown> = {},
): Promise<T> =>
  withClient(async (client) => {
    const result = (await client.callTool({ name, arguments: args })) as ToolResult;

    if (result.isError) {
      throw new Error(result.content?.[0]?.text ?? `tool ${name} failed`);
    }

    return result.structuredContent as T;
  });

export const callToolRaw = async (
  name: string,
  args: Record<string, unknown> = {},
): Promise<ToolResult> =>
  withClient(
    async (client) => (await client.callTool({ name, arguments: args })) as ToolResult,
  );

export const listTools = async () => withClient((client) => client.listTools());
