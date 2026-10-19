/**
 * Connects a REAL MCP client to a running server over Streamable HTTP.
 *
 * F6's acceptance criterion is explicit: "connection validated with a real MCP
 * client, not only by unit test". A unit test does not prove protocol
 * negotiation, so this drives the published SDK client against the built
 * server and prints what was negotiated, listed and returned.
 *
 * Usage: node scripts/mcp-client-probe.mjs [url]
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const url = new URL(process.argv[2] ?? 'http://127.0.0.1:8080/api/mcp');

const fail = message => {
  console.error(`FAIL: ${message}`);
  process.exit(1);
};

const client = new Client({ name: 'nandomoreira-dev-probe', version: '1.0.0' });

try {
  await client.connect(new StreamableHTTPClientTransport(url));
} catch (error) {
  fail(`could not connect to ${url}: ${error.message}`);
}

const serverInfo = client.getServerVersion();
console.log(`server:   ${serverInfo?.name} ${serverInfo?.version}`);

const protocolVersion = client.getServerCapabilities
  ? (client.transport?.protocolVersion ?? 'negotiated (not exposed by the client)')
  : 'unknown';
console.log(`protocol: ${protocolVersion}`);

if (serverInfo?.name !== 'nandomoreira-dev') {
  fail(`unexpected server name: ${serverInfo?.name}`);
}

const { tools } = await client.listTools();
const names = tools.map(tool => tool.name).sort();
console.log(`tools:    ${names.join(', ')}`);

const EXPECTED = ['check_availability', 'get_profile', 'get_project', 'get_resume', 'list_projects'];

if (JSON.stringify(names) !== JSON.stringify(EXPECTED)) {
  fail(`tool list mismatch. expected ${EXPECTED.join(', ')}`);
}

const structured = async (name, args = {}) => {
  const result = await client.callTool({ name, arguments: args });

  if (result.isError) {
    fail(`${name} answered isError: ${result.content?.[0]?.text}`);
  }

  return result.structuredContent;
};

const profile = await structured('get_profile');
console.log(`get_profile:        ${profile.name} — ${profile.headline}`);

const availability = await structured('check_availability');
console.log(`check_availability: ${availability.status}, updated ${availability.updatedAt}`);

const list = await structured('list_projects', { collection: 'lab' });
console.log(`list_projects:      ${list.total} cases in lab`);

const first = list.projects[0];
const detail = await structured('get_project', { slug: first.slug });
console.log(`get_project:        ${detail.slug} — ${detail.title}`);

const resume = await structured('get_resume');
console.log(
  `get_resume:         ${resume.basics.name}, ${resume.projects?.length ?? 0} projects, x_agent ${resume.x_agent.availability.status}`,
);

// An unknown slug must come back as a tool error, not tear down the connection.
const unknown = await client.callTool({
  name: 'get_project',
  arguments: { slug: 'nao-existe-mesmo' },
});
if (!unknown.isError) fail('an unknown slug did not produce a tool error');
console.log('unknown slug:       tool error, connection intact');

const everything = JSON.stringify({ profile, availability, list, detail, resume });
if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(everything)) fail('a tool answer exposed an e-mail');
if (/\bliquid\b/i.test(everything)) fail('a tool answer named a confidential client');
console.log('leak scan:          no e-mail, no confidential client');

await client.close();
console.log('MCP CLIENT PASSED');
