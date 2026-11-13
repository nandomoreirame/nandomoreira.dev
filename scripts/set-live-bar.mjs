// Manages the announcement bar items (Firestore site_config/live_bar).
//
//   node scripts/set-live-bar.mjs list
//   node scripts/set-live-bar.mjs add "Texto" [--badge "Novo"] [--text-en "Text"] [--badge-en "New"] [--href https://... | --channel youtube|twitch]
//   node scripts/set-live-bar.mjs remove <number>      (number as shown by list)
//   node scripts/set-live-bar.mjs clear                (back to the default items)
//   node scripts/set-live-bar.mjs on | off             (show or hide the whole bar)
//
// Credentials: Application Default Credentials (`gcloud auth application-default login`)
// or FIREBASE_SERVICE_ACCOUNT with the service account JSON. The site caches the answer for up to 5 minutes.
import { cert, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const [command, ...rest] = process.argv.slice(2);
const inlineKey = process.env.FIREBASE_SERVICE_ACCOUNT;

initializeApp({
  projectId: process.env.GOOGLE_CLOUD_PROJECT ?? 'nandomoreira-dev',
  ...(inlineKey ? { credential: cert(JSON.parse(inlineKey)) } : {}),
});

const ref = getFirestore().collection('site_config').doc('live_bar');
const flag = name => {
  const at = rest.indexOf(`--${name}`);
  return at === -1 ? undefined : rest[at + 1];
};
const fail = message => {
  console.error(message);
  process.exit(1);
};
const show = items =>
  items.length === 0
    ? console.log('(no items: the site shows its default)')
    : items.forEach((item, i) =>
        console.log(
          `${i + 1}. ${item.badge ? `[${item.badge}] ` : ''}${item.text}${item.textEn ? ` | en: ${item.badgeEn ? `[${item.badgeEn}] ` : ''}${item.textEn}` : ''}${item.href ? ` -> ${item.href}` : item.channel ? ` -> ${item.channel}` : ''}`,
        ),
      );

const snapshot = await ref.get();
const items = Array.isArray(snapshot.data()?.items) ? snapshot.data().items : [];

if (command === 'list') {
  show(items);
} else if (command === 'add') {
  const text = rest[0];
  if (!text || text.startsWith('--'))
    fail(
      'Usage: add "<text>" [--badge X] [--text-en Y] [--badge-en Z] [--href URL | --channel youtube|twitch]',
    );
  /** @type {Record<string, string>} */
  const item = { text };
  for (const key of ['badge', 'href', 'channel']) if (flag(key)) item[key] = flag(key);
  if (flag('text-en')) item.textEn = flag('text-en');
  if (flag('badge-en')) item.badgeEn = flag('badge-en');
  items.push(item);
  await ref.set({ items, enabled: true, schedule: FieldValue.delete() }, { merge: true });
  show(items);
} else if (command === 'remove') {
  const index = Number(rest[0]) - 1;
  if (!Number.isInteger(index) || index < 0 || index >= items.length) fail('Usage: remove <number from list>');
  items.splice(index, 1);
  await ref.set({ items }, { merge: true });
  show(items);
} else if (command === 'clear') {
  await ref.set({ items: [], schedule: FieldValue.delete() }, { merge: true });
  show([]);
} else if (command === 'on' || command === 'off') {
  await ref.set({ enabled: command === 'on' }, { merge: true });
  console.log(`bar ${command}`);
} else {
  fail('Usage: set-live-bar.mjs list | add | remove | clear | on | off');
}
