import argon2 from "argon2";

/** Hash a plaintext password with Argon2id. */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

/** Verify a plaintext password against a stored Argon2 hash. */
export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  if (!hash || !password) return false;
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}
