/**
 * Walks each route with Tab and records what a keyboard user actually gets.
 *
 * Checks the three things that break silently: the skip link has to be first and
 * has to point at `main`, every focused target has to show a visible focus
 * indicator, and Tab has to move forward without trapping.
 *
 * Usage: node scripts/check-keyboard.mjs <base-url> <path> [more paths...]
 * Requires Chrome on CDP_URL (default http://127.0.0.1:9222).
 */
const [baseUrl, ...paths] = process.argv.slice(2);

if (!baseUrl || paths.length === 0) {
  console.error('usage: node scripts/check-keyboard.mjs <base-url> <path> [more paths...]');
  process.exit(2);
}

const CDP_URL = process.env.CDP_URL ?? 'http://127.0.0.1:9222';
const MAX_TABS = 40;

const connect = (wsUrl) =>
  new Promise((resolve, reject) => {
    const socket = new WebSocket(wsUrl);
    const pending = new Map();
    let nextId = 1;

    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      const waiter = pending.get(message.id);

      if (!waiter) return;

      pending.delete(message.id);

      if (message.error) waiter.reject(new Error(message.error.message));
      else waiter.resolve(message.result);
    });

    socket.addEventListener('error', () => reject(new Error(`cannot reach ${wsUrl}`)));
    socket.addEventListener('open', () =>
      resolve({
        send: (method, params = {}) =>
          new Promise((resolveCall, rejectCall) => {
            const id = nextId++;
            pending.set(id, { resolve: resolveCall, reject: rejectCall });
            socket.send(JSON.stringify({ id, method, params }));
          }),
        close: () => socket.close(),
      }),
    );
  });

const targets = await (await fetch(`${CDP_URL}/json/list`)).json();
const target = targets.find((candidate) => candidate.type === 'page');

if (!target) {
  console.error(`FAIL: no page target on ${CDP_URL}`);
  process.exit(1);
}

const page = await connect(target.webSocketDebuggerUrl);

const evaluate = async (expression) => {
  const { result } = await page.send('Runtime.evaluate', { expression, returnByValue: true });

  return JSON.parse(result.value);
};

const pressTab = async (shift = false) => {
  const modifiers = shift ? 8 : 0;

  await page.send('Input.dispatchKeyEvent', {
    type: 'rawKeyDown',
    key: 'Tab',
    code: 'Tab',
    windowsVirtualKeyCode: 9,
    nativeVirtualKeyCode: 9,
    modifiers,
  });
  await page.send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Tab',
    code: 'Tab',
    windowsVirtualKeyCode: 9,
    nativeVirtualKeyCode: 9,
    modifiers,
  });
};

/**
 * Records the UNFOCUSED appearance of every focusable element first.
 *
 * Accepting "has a box-shadow" as proof of a focus indicator is not good enough:
 * an element with a decorative shadow would pass with its focus styling deleted,
 * which is the exact regression this gate exists to catch. So the baseline is
 * captured while nothing is focused, and focus has to CHANGE something.
 */
const BASELINE = `(() => {
  const focusable = document.querySelectorAll(
    'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
  );
  let index = 0;
  for (const el of focusable) {
    const style = getComputedStyle(el);
    el.dataset.kbIndex = String(index++);
    el.dataset.kbBase = [style.outlineStyle, style.outlineWidth, style.outlineColor, style.boxShadow, style.borderColor, style.backgroundColor].join('|');
  }
  return JSON.stringify(index);
})()`;

const ACTIVE = `(() => {
  const el = document.activeElement;
  if (!el || el === document.body) return JSON.stringify({ tag: null });

  const style = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  const now = [style.outlineStyle, style.outlineWidth, style.outlineColor, style.boxShadow, style.borderColor, style.backgroundColor].join('|');
  const base = el.dataset.kbBase;
  const outlineWidth = parseFloat(style.outlineWidth) || 0;
  const paints =
    (style.outlineStyle !== 'none' && outlineWidth > 0) ||
    (style.boxShadow !== 'none' && style.boxShadow !== '');

  return JSON.stringify({
    tag: el.tagName.toLowerCase(),
    text: (el.textContent || '').trim().slice(0, 40),
    href: el.getAttribute('href'),
    top: Math.round(rect.top),
    visible: rect.width > 0 && rect.height > 0,
    tracked: base !== undefined,
    // Focus must both change the element AND paint something: a change alone
    // could be an invisible property, and paint alone could be decoration.
    focusRing: base === undefined ? paints : now !== base && paints,
  });
})()`;

let failed = 0;

for (const path of paths) {
  await page.send('Page.navigate', { url: `${baseUrl}${path}` });
  await new Promise((resolve) => setTimeout(resolve, 1200));
  await evaluate('JSON.stringify((document.body.focus(), true))');
  await evaluate(BASELINE);

  const problems = [];
  const order = [];
  let noRing = 0;

  await pressTab();
  const first = await evaluate(ACTIVE);

  // Both conditions, not either: skip-like text pointing nowhere is exactly the
  // broken skip link this is supposed to catch.
  if (first.href !== '#main') {
    problems.push(
      `first Tab lands on ${first.tag}${first.href ? `[href=${first.href}]` : ''}, not a link to #main`,
    );
  }
  if (!/pular|skip/i.test(first.text ?? '')) {
    problems.push(`the first stop reads "${first.text}", which does not announce itself as a skip link`);
  }

  order.push(first);

  for (let i = 0; i < MAX_TABS; i += 1) {
    await pressTab();
    const current = await evaluate(ACTIVE);

    if (!current.tag) break;

    order.push(current);

    if (current.visible && !current.focusRing) {
      noRing += 1;
      if (noRing <= 3) problems.push(`no focus ring on <${current.tag}> "${current.text}"`);
    }
  }

  // Shift+Tab must go back, or the user is stuck moving one way only.
  await pressTab(true);
  const back = await evaluate(ACTIVE);
  if (!back.tag) problems.push('Shift+Tab did not move focus back');

  if (problems.length > 0) {
    console.error(`FAIL ${path}: ${problems.join('; ')}`);
    failed += 1;
  } else {
    console.log(`OK ${path} (${order.length} stops, skip link first, focus visible throughout)`);
  }
}

page.close();

if (failed > 0) {
  console.error(`${failed} route(s) have keyboard problems`);
  process.exit(1);
}

console.log('KEYBOARD WALK PASSED');
