import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { version } from '../../../package.json';
import { buildResume } from '../aeo/resume';
import { getAllProjects, getProfile, getProject } from '../content';
import { toolMeta } from './catalog';
import { toAvailabilityAnswer, toProfileAnswer } from './tools/profile';
import { toProjectDetail, toProjectSummaries } from './tools/projects';

/** Declared so a client can record exactly what it spoke to (REQ-011). */
export const MCP_SERVER_INFO = {
  name: 'nandomoreira-dev',
  version,
} as const;

/**
 * The site the tools answer about. The MCP transport has no `Astro.site`, and
 * every URL a tool returns must still be absolute, so the canonical origin is
 * declared once here instead of being guessed from a request header, which a
 * client could forge.
 */
const SITE = new URL('https://nandomoreira.dev');

const COLLECTIONS = ['portfolio', 'lab'] as const;

/** Serialises a tool answer both ways: text for readers, structured for parsers. */
const answer = (payload: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }],
  structuredContent: payload as Record<string, unknown>,
});

const toolError = (message: string) => ({
  content: [{ type: 'text' as const, text: message }],
  isError: true,
});

/**
 * Builds a server with the five tools registered.
 *
 * A NEW instance per request, never a module-level singleton. In stateless mode
 * a shared instance collides request IDs between concurrent clients, and this
 * backend serves with concurrency 80 (AD-002 of the spec). The module-level
 * server is the natural shape here and the wrong one.
 */
export const createMcpServer = async (): Promise<McpServer> => {
  const server = new McpServer(MCP_SERVER_INFO);

  server.registerTool(
    'get_profile',
    toolMeta('get_profile'),
    async () => answer(toProfileAnswer(await getProfile())),
  );

  server.registerTool(
    'check_availability',
    toolMeta('check_availability'),
    async () => answer(toAvailabilityAnswer(await getProfile())),
  );

  server.registerTool(
    'list_projects',
    {
      ...toolMeta('list_projects'),
      inputSchema: {
        collection: z
          .enum(COLLECTIONS)
          .optional()
          .describe('Restrict to "portfolio" (client work) or "lab" (own products).'),
      },
    },
    async ({ collection }) => {
      const projects = toProjectSummaries(await getAllProjects(), collection);

      // Wrapped in an object because the protocol requires structuredContent to
      // be a record; a bare array is rejected by the client at -32602.
      return answer({ projects, total: projects.length });
    },
  );

  server.registerTool(
    'get_project',
    {
      ...toolMeta('get_project'),
      inputSchema: {
        slug: z.string().min(1).describe('The case slug, as returned by list_projects.'),
      },
    },
    async ({ slug }) => {
      const project = await getProject(slug);

      if (!project) {
        // A tool error, not a throw: an unknown slug is a normal outcome of a
        // client guessing, and the connection must survive it (REQ-007).
        return toolError(`No case with slug "${slug}". Call list_projects to see valid slugs.`);
      }

      return answer(toProjectDetail(project));
    },
  );

  server.registerTool(
    'get_resume',
    toolMeta('get_resume'),
    async () => {
      const [profile, projects] = await Promise.all([getProfile(), getAllProjects()]);

      return answer(buildResume({ site: SITE, profile, projects }));
    },
  );

  return server;
};
