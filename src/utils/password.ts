// Password hashing with PBKDF2-SHA256 (Web Crypto API) and a random salt.
// Only the hash and the salt are stored — never the password itself.

const ITERATIONS = 210_000;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(2 * i, 2 * i + 2), 16);
  return out;
}

async function derive(password: string, salt: Uint8Array<ArrayBuffer>): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS }, key, 256);
  return toHex(new Uint8Array(bits));
}

export interface PasswordHash {
  passwordHash: string;
  salt: string;
}

export async function hashPassword(password: string): Promise<PasswordHash> {
  const salt = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(16)));
  return { passwordHash: await derive(password, salt), salt: toHex(salt) };
}

/** Constant-time comparison of the derived hash with the stored one. */
export async function verifyPassword(password: string, stored: PasswordHash): Promise<boolean> {
  const actual = await derive(password, fromHex(stored.salt));
  if (actual.length !== stored.passwordHash.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual.charCodeAt(i) ^ stored.passwordHash.charCodeAt(i);
  return diff === 0;
}
