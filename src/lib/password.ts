import bcrypt from "bcryptjs";
import crypto from "crypto";

const SALT_ROUNDS = 10;

export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, SALT_ROUNDS);
}

export async function verifyPassword(
  plaintext: string,
  hashed: string
): Promise<boolean> {
  if (!hashed) return !plaintext; // both empty → match
  return bcrypt.compare(plaintext, hashed);
}

/**
 * Timing-safe comparison for plaintext admin passwords.
 *
 * Uses SHA-256 to normalise both sides to the same length before
 * calling crypto.timingSafeEqual, so the comparison time doesn't leak
 * information about which characters matched.
 */
export function timingSafeCompare(input: string, secret: string): boolean {
  const inputHash = crypto.createHash("sha256").update(input).digest();
  const secretHash = crypto.createHash("sha256").update(secret).digest();
  return crypto.timingSafeEqual(inputHash, secretHash);
}
