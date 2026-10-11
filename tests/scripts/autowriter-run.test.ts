import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SCRIPT = resolve('scripts/autowriter-run.sh');

const POST = (slug: string, draft: boolean) =>
  `---\nslug: ${slug}\ntitle: "Um título: com dois-pontos"\n${draft ? 'draft: true\n' : ''}---\n\nTexto.\n`;

interface Options {
  /** What the fake agent writes: a new post, or nothing. */
  writes?: { slug: string; draft: boolean } | null;
  agentExit?: number;
  deployOutput?: string;
  httpCode?: string;
}

// Fake binaries come first in PATH, and `env -i` keeps ~/.bashrc (BASH_ENV) from
// putting the real claude back in front of them.
const run = ({ writes = { slug: 'post-novo', draft: true }, agentExit = 0, deployOutput = 'STAGING DEPLOY PASSED', httpCode = '200' }: Options = {}) => {
  const dir = mkdtempSync(join(tmpdir(), 'autowriter-'));
  const root = join(dir, 'repo');
  const bin = join(dir, 'bin');
  mkdirSync(join(root, 'src/content/posts'), { recursive: true });
  mkdirSync(bin);
  writeFileSync(join(root, 'src/content/posts/existente.md'), POST('existente', false));

  const write = writes ? `cat > "$AUTOWRITER_ROOT/src/content/posts/${writes.slug}.md" <<'EOF'\n${POST(writes.slug, writes.draft)}EOF\n` : '';
  const fakes: Record<string, string> = {
    claude: `#!/bin/bash\nprintf '%s\\n' "$@" > "${dir}/claude-args"\n${write}echo "relatório do agente"\nexit ${agentExit}\n`,
    curl: `#!/bin/bash\nprintf '%s' "${httpCode}"\n`,
    deploy: `#!/bin/bash\necho "${deployOutput}"\n`,
  };
  for (const [name, body] of Object.entries(fakes)) {
    writeFileSync(join(bin, name), body);
    chmodSync(join(bin, name), 0o755);
  }

  const result = spawnSync(
    'env',
    [
      '-i',
      `HOME=${dir}`,
      `PATH=${bin}:/usr/bin:/bin`,
      `AUTOWRITER_ROOT=${root}`,
      `AUTOWRITER_ENV=${join(dir, 'no-env')}`,
      `AUTOWRITER_LOG_DIR=${join(dir, 'logs')}`,
      `AUTOWRITER_DEPLOY_CMD=${join(bin, 'deploy')}`,
      'bash',
      SCRIPT,
    ],
    { encoding: 'utf8', timeout: 15_000 },
  );
  const args = (() => {
    try {
      return readFileSync(join(dir, 'claude-args'), 'utf8');
    } catch {
      return '';
    }
  })();
  return { ...result, out: result.stdout + result.stderr, args };
};

describe('scripts/autowriter-run.sh', () => {
  it('deploys the new draft and announces its staging URL and title', () => {
    const { status, out } = run();
    expect(out).toContain('NOTIFY: Rascunho novo para revisar: **Um título: com dois-pontos**');
    expect(out).toContain('http://nandomoreira.home/post-novo');
    expect(out.trim().endsWith('AUTOWRITER RUN PASSED')).toBe(true);
    expect(status).toBe(0);
  });

  it('runs the post-autowriter agent headless with git writes and the deploy denied', () => {
    const { args } = run();
    expect(args).toMatch(/^--agent\npost-autowriter$/m);
    for (const denied of ['Bash(git commit:*)', 'Bash(git push:*)', 'Bash(*deploy-staging*)']) {
      expect(args).toContain(denied);
    }
  });

  it.each<[string, Options, string]>([
    ['the agent fails', { agentExit: 1 }, 'o agente terminou com erro'],
    ['no post was written', { writes: null }, 'esperava 1 post novo, achei 0'],
    ['the post is not a draft', { writes: { slug: 'publicado', draft: false } }, 'não está como draft: true'],
    ['the deploy has no PASSED marker', { deployOutput: 'boom' }, 'o deploy da homologação falhou'],
    ['the draft URL does not answer 200', { httpCode: '404' }, 'respondeu 404'],
  ])('reports on Discord and exits non-zero when %s', (_case, options, reason) => {
    const { status, out } = run(options);
    expect(status).not.toBe(0);
    expect(out).toMatch(/^NOTIFY: post-autowriter falhou: .+$/m);
    expect(out.match(/^NOTIFY: .*$/m)?.[0]).toContain(reason);
    expect(out).not.toContain('AUTOWRITER RUN PASSED');
  });
});
