import { readLimitedText } from '../hire/read-body';
import type { Hit, Recorder } from './recorder';

export interface McpCall {
  method: string;
  tool?: string;
  client?: string;
}

const MAX_NAME = 64;
const MAX_MESSAGES = 20;

const name = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const text = value.replace(/[\p{Cc}\p{Cf}]/gu, '').trim().slice(0, MAX_NAME);
  return text === '' ? undefined : text;
};

/**
 * What an agent asked for, never what it sent: only the method, the tool name
 * and the client name are read, and arguments are not even looked at (REQ-011).
 */
export const mcpCalls = (body: string): McpCall[] => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return [];
  }

  const messages = (Array.isArray(parsed) ? parsed : [parsed]).slice(0, MAX_MESSAGES);

  return messages.flatMap((message): McpCall[] => {
    if (!message || typeof message !== 'object') return [];
    const { method, params } = message as { method?: unknown; params?: { name?: unknown; clientInfo?: { name?: unknown } } };
    const methodName = name(method);
    if (!methodName) return [];

    const tool = methodName === 'tools/call' ? name(params?.name) : undefined;
    const client = methodName === 'initialize' ? name(params?.clientInfo?.name) : undefined;

    return [{ method: methodName, ...(tool ? { tool } : {}), ...(client ? { client } : {}) }];
  });
};

/**
 * Records what one MCP request asked for, in a single write. The body is read
 * from a clone, so the transport still gets it untouched, and not read at all
 * when nothing would be recorded (no secret, or the author).
 */
export const recordMcpUsage = async (
  request: Request,
  recorder: Pick<Recorder, 'active' | 'recordAll'>,
): Promise<void> => {
  if (request.method !== 'POST' || !recorder.active(request)) return;

  const body = await readLimitedText(request.clone()).catch(() => '');
  const hits = mcpCalls(body).map(
    (call): Hit => ({
      kind: 'conversion',
      path: '/api/mcp',
      source: 'api',
      referrer: null,
      conversion: {
        type: 'mcp',
        target: call.method,
        ...(call.tool ? { tool: call.tool } : {}),
        ...(call.client ? { client: call.client } : {}),
      },
    }),
  );

  if (hits.length > 0) await recorder.recordAll(request, hits);
};
