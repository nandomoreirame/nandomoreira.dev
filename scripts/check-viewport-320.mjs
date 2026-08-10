/**
 * Measures horizontal overflow at 320px against a RUNNING server.
 *
 * The existing gate forbids `min-w-dvw` in the base layer, which blocks the most
 * common cause, but nobody checks the effect. A static sweep of the built CSS
 * would flag every legitimate fixed width and still miss overflow caused by
 * content, so this drives a real browser and asks the page itself.
 *
 * Speaks CDP over Node's built-in WebSocket: no new dependency for a check that
 * runs on demand.
 *
 * Usage: node scripts/check-viewport-320.mjs <base-url> <path> [more paths...]
 * Requires Chrome already listening on CDP_URL (default http://127.0.0.1:9222).
 */
const [baseUrl, ...paths] = process.argv.slice(2);

if (!baseUrl || paths.length === 0) {
  console.error('usage: node scripts/check-viewport-320.mjs <base-url> <path> [more paths...]');
  process.exit(2);
}

const WIDTH = 320;
const CDP_URL = process.env.CDP_URL ?? 'http://127.0.0.1:9222';

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
  console.error(`FAIL: no page target on ${CDP_URL}. Start Chrome with --remote-debugging-port.`);
  process.exit(1);
}

const page = await connect(target.webSocketDebuggerUrl);

await page.send('Emulation.setDeviceMetricsOverride', {
  width: WIDTH,
  height: 640,
  deviceScaleFactor: 1,
  mobile: true,
});

/**
 * `scrollWidth` alone is blind here: the base layer sets `overflow-x: hidden` on
 * `body`, so genuine overflow is clipped and the document never reports it. That
 * hides the defect rather than fixing it, and a gate that reads scrollWidth
 * passes happily while content is cut off screen. Proven: injecting a 900px box
 * left scrollWidth at 320.
 *
 * So the real question is whether any element extends past the viewport edge
 * without an ancestor that deliberately scrolls it. `html` and `body` are
 * excluded from that ancestor search precisely because their hidden overflow is
 * the global masking rule, not a local decision to make something scrollable.
 */
const MEASURE = `JSON.stringify({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
  offender: (() => {
    const scrolls = (el) => {
      const x = getComputedStyle(el).overflowX;
      return x === 'auto' || x === 'scroll';
    };
    const clippedByAncestor = (el) => {
      for (let parent = el.parentElement; parent; parent = parent.parentElement) {
        if (parent === document.body || parent === document.documentElement) return false;
        if (scrolls(parent)) return true;
        if (getComputedStyle(parent).overflowX === 'hidden') return true;
      }
      return false;
    };

    for (const el of document.querySelectorAll('body *')) {
      const style = getComputedStyle(el);
      if (style.position === 'fixed' || style.display === 'none' || style.visibility === 'hidden') continue;
      if (scrolls(el) || clippedByAncestor(el)) continue;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;

      if (rect.right > ${WIDTH} + 1) {
        const name = String(el.className || '').split(' ').slice(0, 3).join('.');
        return el.tagName.toLowerCase() + (name ? '.' + name : '') + ' right=' + Math.round(rect.right);
      }
    }
    return null;
  })(),
})`;

let failed = 0;

for (const path of paths) {
  await page.send('Page.navigate', { url: `${baseUrl}${path}` });

  // These routes ship zero client JavaScript, so layout is settled once the HTML
  // is parsed; a fixed settle beats wiring up load events over a raw socket.
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const { result } = await page.send('Runtime.evaluate', {
    expression: MEASURE,
    returnByValue: true,
  });

  const { scrollWidth, clientWidth, offender } = JSON.parse(result.value);

  if (offender || scrollWidth > clientWidth) {
    console.error(
      `FAIL ${path}: ` +
        (offender
          ? `element past the ${WIDTH}px edge: ${offender}`
          : `scrollWidth ${scrollWidth} > clientWidth ${clientWidth}`),
    );
    failed += 1;
  } else {
    console.log(`OK ${path} (nothing past ${WIDTH}px)`);
  }
}

page.close();

if (failed > 0) {
  console.error(`${failed} route(s) scroll horizontally at ${WIDTH}px`);
  process.exit(1);
}

console.log('VIEWPORT 320 PASSED');
