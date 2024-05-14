import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.string(),
  NEXT_PUBLIC_ROOT_DOMAIN: z.string(),
  GA4_SITE_ID: z.string(),
  GA4_LAB_ID: z.string(),
  GA4_BLOG_ID: z.string(),
});

const parseEnv = envSchema.parse(process.env);

const IS_DEV = parseEnv.NODE_ENV === 'development';

const HTTP = `http${!IS_DEV ? 's' : ''}://`;
const SITE_BASE_URL = `${HTTP}${parseEnv.NEXT_PUBLIC_ROOT_DOMAIN}`;
const API_BASE_URL = `${HTTP}api.${parseEnv.NEXT_PUBLIC_ROOT_DOMAIN}`;
const BLOG_BASE_URL = `${HTTP}blog.${parseEnv.NEXT_PUBLIC_ROOT_DOMAIN}`;
const LAB_BASE_URL = `${HTTP}lab.${parseEnv.NEXT_PUBLIC_ROOT_DOMAIN}`;

export const env = {
  ...parseEnv,
  IS_DEV,
  SITE_BASE_URL,
  API_BASE_URL,
  BLOG_BASE_URL,
  LAB_BASE_URL,
};
