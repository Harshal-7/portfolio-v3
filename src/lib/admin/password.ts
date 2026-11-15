import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from "node:crypto";

/**
 * Admin password hashing with scrypt. The stored form is
 *   scrypt:<N>:<r>:<p>:<salt base64url>:<hash base64url>
 * with ":" separators, because "$" gets expanded inside .env files.
 */

const N = 32768;
const R = 8;
const P = 1;
const KEY_LEN = 32;
// 128 * N * r = 32 MiB, which is exactly Node's default limit, so allow a little more.
const MAX_MEM = 64 * 1024 * 1024;

function scrypt(password: string, salt: Buffer, keyLen: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password.normalize("NFKC"), salt, keyLen, options, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, KEY_LEN, { N, r: R, p: P, maxmem: MAX_MEM });
  return ["scrypt", N, R, P, salt.toString("base64url"), key.toString("base64url")].join(":");
}

export async function verifyPassword(password: string, stored: string | undefined): Promise<boolean> {
  if (!stored || password.length === 0 || password.length > 512) return false;
  const parts = stored.trim().split(":");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [n, r, p] = parts.slice(1, 4).map(Number);
  const salt = Buffer.from(parts[4], "base64url");
  const expected = Buffer.from(parts[5], "base64url");
  const sane =
    Number.isInteger(n) && n >= 16384 && n <= 1048576 && (n & (n - 1)) === 0 &&
    Number.isInteger(r) && r >= 8 && r <= 16 &&
    Number.isInteger(p) && p >= 1 && p <= 4 &&
    salt.length >= 16 && expected.length >= 16 && expected.length <= 64;
  if (!sane) return false;
  const actual = await scrypt(password, salt, expected.length, { N: n, r, p, maxmem: 256 * n * r });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
