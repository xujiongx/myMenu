import { compare, hash } from "bcryptjs";

const ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, ROUNDS);
}

export async function verifyPassword(
  plain: string,
  passwordHash: string,
): Promise<boolean> {
  return compare(plain, passwordHash);
}

export function isValidAccount(account: string): boolean {
  return /^[A-Za-z0-9]+$/.test(account);
}
