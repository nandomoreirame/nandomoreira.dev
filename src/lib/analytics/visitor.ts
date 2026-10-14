import { createHmac } from 'node:crypto';

/**
 * Two HMACs, so the key of a day is derived and never stored: the hashes of one
 * day cannot be joined to the next, and the IP itself is never written
 * anywhere (REQ-005).
 */
export const visitorHash = ({
  secret,
  day,
  ip,
  userAgent,
}: {
  secret: string;
  day: string;
  ip: string;
  userAgent: string | null;
}): string => {
  const dailyKey = createHmac('sha256', secret).update(day).digest();

  return createHmac('sha256', dailyKey).update(`${ip}\n${userAgent ?? ''}`).digest('hex').slice(0, 32);
};
