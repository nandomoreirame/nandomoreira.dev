import { env } from '@/environments';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDomain(subdomain?: string) {
  const sub = subdomain ? `${subdomain}.` : '';
  const http = `http${env.NODE_ENV === 'production' ? 's' : ''}://`;
  return `${http}${sub}${env.NEXT_PUBLIC_ROOT_DOMAIN}`;
}
