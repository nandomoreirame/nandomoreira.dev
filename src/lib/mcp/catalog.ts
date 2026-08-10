/**
 * The single declaration of the tool surface.
 *
 * `server.ts` registers from this list and `AGENTS.md` documents from it, so
 * the advertised tools cannot drift from the served ones. A hand-written list
 * in the documentation is exactly the copy that falls behind (REQ-012).
 */
export const MCP_TOOLS = [
  {
    name: 'get_profile',
    title: 'Get profile',
    description:
      'Returns who Fernando Moreira Costa is: headline, bio, positioning, stack, the services on offer and current availability. No contact address: to make contact, POST /api/hire.',
  },
  {
    name: 'check_availability',
    title: 'Check availability',
    description:
      'Returns whether he is open to new work, with the detail and the date the answer was last updated, so you can tell a fresh answer from a stale one.',
  },
  {
    name: 'list_projects',
    title: 'List projects',
    description:
      'Lists the published cases. Optionally filter by collection: "portfolio" is client work, "lab" is his own products and tooling. Returns an empty list when nothing matches, never an error.',
  },
  {
    name: 'get_project',
    title: 'Get project',
    description:
      'Returns one case in full: the problem, the decisions taken, the outcome and the links that prove it. Use list_projects first to discover slugs.',
  },
  {
    name: 'get_resume',
    title: 'Get resume',
    description:
      'Returns the full resume in the JSON Resume schema, identical to what GET /api/resume.json serves, plus an x_agent block with availability and how to make contact.',
  },
] as const;

export type McpToolName = (typeof MCP_TOOLS)[number]['name'];

const byName = new Map(MCP_TOOLS.map((tool) => [tool.name, tool]));

export const toolMeta = (name: McpToolName): { title: string; description: string } => {
  const tool = byName.get(name);

  if (!tool) {
    throw new Error(`Unknown MCP tool "${name}". The catalog is the single declaration.`);
  }

  return { title: tool.title, description: tool.description };
};
