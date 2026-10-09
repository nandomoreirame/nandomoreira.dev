import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { type Firestore, getFirestore } from 'firebase-admin/firestore';

/**
 * One app for the whole process, unlike the MCP server where a singleton is the
 * bug. Here the connection pool and the credential refresh are exactly what
 * should be shared: re-initialising per request would re-authenticate on every
 * call and eventually be rejected.
 */
let client: Firestore | undefined;

/**
 * App Hosting runs under a service identity, so Application Default Credentials
 * already resolve. A key file in the repository would be a secret we do not
 * need to have.
 */
const app = () => {
  const [existing] = getApps();

  if (existing) return existing;

  const inlineKey = process.env.FIREBASE_SERVICE_ACCOUNT;

  return initializeApp(inlineKey ? { credential: cert(JSON.parse(inlineKey)) } : undefined);
};

export const getFirestoreClient = (): Firestore => {
  client ??= getFirestore(app());

  return client;
};

/** Only for tests: drops the memoised client so a fake can take its place. */
export const resetFirestoreClient = (): void => {
  client = undefined;
};

export const HIRE_COLLECTION = 'hire_requests';
/** IP and user agent per briefing, same id, shorter TTL. */
export const HIRE_NETWORK_COLLECTION = 'hire_request_network';
