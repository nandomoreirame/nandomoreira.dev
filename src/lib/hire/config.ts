export interface HireConfig {
  apiKey: string;
  notifyTo: string;
  notifyFrom: string;
}

const REQUIRED = {
  RESEND_API_KEY: 'apiKey',
  HIRE_NOTIFY_TO: 'notifyTo',
  HIRE_NOTIFY_FROM: 'notifyFrom',
} as const satisfies Record<string, keyof HireConfig>;

const present = (value: string | undefined): value is string =>
  typeof value === 'string' && value.trim().length > 0;

/**
 * Reads the hire configuration, failing loudly when anything is missing.
 *
 * The alternative, degrading to "never notifies", is the worst failure this
 * feature has: the briefing is persisted, nobody is told, and the author only
 * discovers it by losing a contact (REQ-010).
 *
 * The error names every missing variable at once so a single deploy fixes them
 * all, and never echoes a value: this message ends up in logs.
 */
export const readHireConfig = (env: Record<string, string | undefined>): HireConfig => {
  const missing = Object.keys(REQUIRED).filter((name) => !present(env[name]));

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
        'Declare them in apphosting.yaml with availability: [RUNTIME] and store the ' +
        'values in Secret Manager, never in the repository.',
    );
  }

  return {
    apiKey: env.RESEND_API_KEY!.trim(),
    notifyTo: env.HIRE_NOTIFY_TO!.trim(),
    notifyFrom: env.HIRE_NOTIFY_FROM!.trim(),
  };
};
