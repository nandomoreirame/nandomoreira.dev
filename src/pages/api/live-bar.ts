import type { APIRoute } from 'astro';
import { liveBarResponse } from '../../lib/live-bar/config';

export const prerender = false;

export const GET: APIRoute = () => liveBarResponse();
