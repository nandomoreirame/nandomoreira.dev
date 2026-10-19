import { describe, expect, it } from 'vitest';
import { readHireConfig } from '../../src/lib/hire/config';

const complete = {
  RESEND_API_KEY: 're_test_key',
  HIRE_NOTIFY_TO: 'destino@example.com',
  HIRE_NOTIFY_FROM: 'agent@nandomoreira.dev',
};

describe('readHireConfig', () => {
  it('throws when the mail key is missing, instead of never notifying in silence', () => {
    // The silent failure mode is the worst one: persisted, never notified, and
    // the author only finds out by losing a contact.
    const { RESEND_API_KEY: _dropped, ...rest } = complete;

    expect(() => readHireConfig(rest)).toThrow(/RESEND_API_KEY/);
  });

  it('throws when the destination address is missing', () => {
    const { HIRE_NOTIFY_TO: _dropped, ...rest } = complete;

    expect(() => readHireConfig(rest)).toThrow(/HIRE_NOTIFY_TO/);
  });

  it('throws when the sender address is missing, which Resend requires', () => {
    const { HIRE_NOTIFY_FROM: _dropped, ...rest } = complete;

    expect(() => readHireConfig(rest)).toThrow(/HIRE_NOTIFY_FROM/);
  });

  it('treats an empty string as absent, since a blank secret notifies nobody', () => {
    expect(() => readHireConfig({ ...complete, HIRE_NOTIFY_TO: '   ' })).toThrow(/HIRE_NOTIFY_TO/);
  });

  it('names every missing variable at once, so one deploy fixes them all', () => {
    expect(() => readHireConfig({})).toThrow(/RESEND_API_KEY[\s\S]*HIRE_NOTIFY_TO/);
  });

  it('returns the configuration when everything is present', () => {
    expect(readHireConfig(complete)).toEqual({
      apiKey: 're_test_key',
      notifyTo: 'destino@example.com',
      notifyFrom: 'agent@nandomoreira.dev',
    });
  });

  it('never puts a secret in the error message', () => {
    // The message reaches logs, which are not where a key belongs.
    try {
      readHireConfig({ RESEND_API_KEY: 're_super_secret' });
      expect.unreachable('should have thrown');
    } catch (error) {
      expect((error as Error).message).not.toContain('re_super_secret');
    }
  });
});
