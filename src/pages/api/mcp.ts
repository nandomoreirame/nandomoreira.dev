import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import type { APIRoute } from 'astro';
import { recordMcpUsage } from '../../lib/analytics/mcp-usage';
import { recorder } from '../../lib/analytics/runtime';
import { closeWhenDrained } from '../../lib/mcp/lifecycle';
import { createMcpServer } from '../../lib/mcp/server';

export const prerender = false;

/**
 * One server AND one transport per request.
 *
 * Hoisting either to module scope is the natural shape and the wrong one: in
 * stateless mode a shared instance collides request IDs between concurrent
 * clients, and this backend serves with concurrency 80 (REQ-006).
 */
const handle = async (request: Request): Promise<Response> => {
  await recordMcpUsage(request, recorder);

  const server = await createMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    /**
     * Answer with a complete JSON body instead of holding an SSE stream open.
     * A serverless request has no long-lived connection to keep, and the
     * response must be finished by the time the route returns.
     */
    enableJsonResponse: true,
  });

  try {
    await server.connect(transport);

    /**
     * The raw Request is forwarded untouched. Reading the body here would leave
     * the transport with nothing to parse, which fails only on POST and only
     * once a real client connects.
     *
     * The close is deferred to after the body is delivered: doing it here in a
     * `finally` empties the response, and skipping it entirely leaks a server
     * per request at concurrency 80.
     */
    return closeWhenDrained(await transport.handleRequest(request), server);
  } catch {
    await server.close().catch(() => undefined);

    /**
     * A JSON-RPC internal error rather than a 500 with a stack trace: the
     * message must never carry a file path or an internal detail (REQ-004).
     */
    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null,
      }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    );
  }
};

/** Every method the transport understands is forwarded, so a probing client is not broken. */
export const ALL: APIRoute = ({ request }) => handle(request);
