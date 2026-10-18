/** Patterns a machine route must never match. Shared by the leak gates. */
export const MACHINE_LEAKS: Array<[string, RegExp]> = [
  ['email address', /[\w.+-]+@[\w-]+\.[\w.]+/],
  ['absolute filesystem path', /\/(home|Users|var|etc)\//],
  ['api key or token', /(api[_-]?key|secret|token|bearer)\s*[:=]/i],
  ['firebase project id', /nandomoreira-dev/],
  ['private ip', /\b(10|127|192\.168)\.\d+\.\d+\.\d+\b/],
  ['phone number', /wa\.me\/|\b55\d{10,11}\b/],
];
