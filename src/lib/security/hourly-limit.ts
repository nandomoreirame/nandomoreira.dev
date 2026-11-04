import { createHash } from 'node:crypto';

export interface HourlyStore {
  increment: (key: string, expiresAt: Date) => Promise<number>;
}

export const hourlyKeyOf = (ip: string, now: Date): string => {
  const hash = createHash('sha256').update(ip).digest('hex');
  return `${hash}-${now.toISOString().slice(0, 13)}`;
};

export const allowHourly = async (
  ip: string,
  now: Date,
  { store, max }: { store: HourlyStore; max: number },
): Promise<boolean> => {
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const count = await store.increment(hourlyKeyOf(ip, now), expiresAt);
  return count <= max;
};
