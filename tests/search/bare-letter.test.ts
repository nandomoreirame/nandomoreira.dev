// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { forwardBareLetter } from '../../src/lib/search/bare-letter';

const type = (target: HTMLElement, key: string) => {
  let forwarded = false;
  const listener = (event: Event) => {
    const keyEvent = event as KeyboardEvent;
    const origin = keyEvent.composedPath()[0] as HTMLElement | undefined;
    forwarded = forwardBareLetter(origin, keyEvent, false);
  };
  document.addEventListener('keydown', listener);
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true }));
  document.removeEventListener('keydown', listener);
  return forwarded;
};

describe('bare letters across a shadow root', () => {
  it('does not forward m typed in a textarea inside a shadow root', () => {
    const host = document.createElement('div');
    document.body.append(host);
    const shadow = host.attachShadow({ mode: 'open' });
    const area = document.createElement('textarea');
    shadow.append(area);
    expect(type(area, 'm')).toBe(false);
  });

  it('still forwards m typed on the page', () => {
    expect(type(document.body, 'm')).toBe(true);
  });
});
