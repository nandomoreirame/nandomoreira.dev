export interface SpotifyConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export interface NowConfig {
  github: { token?: string };
  spotify?: SpotifyConfig;
  xbox?: { apiKey: string };
}

const trimmed = (value: string | undefined): string | undefined => {
  const text = value?.trim();
  return text ? text : undefined;
};

/**
 * A missing credential degrades one section. This never throws.
 *
 * Hire config fails the boot on purpose, because a contact that is saved and
 * never sent is worse than a crash. /now is optional content, and staging runs
 * without these secrets on purpose (REQ-017).
 */
export const readNowConfig = (env: Record<string, string | undefined>): NowConfig => {
  const clientId = trimmed(env.SPOTIFY_CLIENT_ID);
  const clientSecret = trimmed(env.SPOTIFY_CLIENT_SECRET);
  const refreshToken = trimmed(env.SPOTIFY_REFRESH_TOKEN);
  const apiKey = trimmed(env.OPENXBL_API_KEY);
  const token = trimmed(env.GITHUB_TOKEN);

  return {
    github: token ? { token } : {},
    ...(clientId && clientSecret && refreshToken ? { spotify: { clientId, clientSecret, refreshToken } } : {}),
    ...(apiKey ? { xbox: { apiKey } } : {}),
  };
};
