import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    NODE_ENV: z.string(),
    GA4_SITE_ID: z.string().optional(),
    GA4_LINKS_ID: z.string().optional(),
    ROOT_DOMAIN: z.string(),
    NOTION_ACCESS_TOKEN: z.string(),
    BLOG_DATABASE_ID: z.string(),
    LINKS_DATABASE_ID: z.string(),
    PAGES_DATABASE_ID: z.string(),
    RESEND_API_KEY: z.string(),
    RESEND_AUDIENCE_ID: z.string(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_ROOT_DOMAIN: z.string(),
    NEXT_PUBLIC_NODE_ENV: z.string(),
    NEXT_PUBLIC_ACKEE_SERVER: z.string(),
    NEXT_PUBLIC_ACKEE_ID: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    ROOT_DOMAIN: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
    GA4_SITE_ID: process.env.GA4_SITE_ID,
    GA4_LINKS_ID: process.env.GA4_LINKS_ID,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_AUDIENCE_ID: process.env.RESEND_AUDIENCE_ID,

    NOTION_ACCESS_TOKEN: process.env.NOTION_ACCESS_TOKEN,
    BLOG_DATABASE_ID: process.env.BLOG_DATABASE_ID,
    LINKS_DATABASE_ID: process.env.LINKS_DATABASE_ID,
    PAGES_DATABASE_ID: process.env.PAGES_DATABASE_ID,

    NEXT_PUBLIC_ROOT_DOMAIN: process.env.NEXT_PUBLIC_ROOT_DOMAIN,
    NEXT_PUBLIC_NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_ACKEE_SERVER: process.env.NEXT_PUBLIC_ACKEE_SERVER,
    NEXT_PUBLIC_ACKEE_ID: process.env.NEXT_PUBLIC_ACKEE_ID,
  },

  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
})
