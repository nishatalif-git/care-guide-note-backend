import { hash, verify, Algorithm } from '@node-rs/argon2';


const OPTIONS = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, OPTIONS);
}

export async function verifyPassword(plain: string, phcHash: string): Promise<boolean> {
  try {
    return await verify(phcHash, plain, OPTIONS);
  } catch {
      return false;
  }
}
