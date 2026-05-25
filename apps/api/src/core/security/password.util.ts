import argon2 from "argon2";

export const hashPassword = async (plainText: string): Promise<string> =>
  argon2.hash(plainText, { type: argon2.argon2id });

export const verifyPassword = async (
  passwordHash: string,
  plainText: string
): Promise<boolean> => argon2.verify(passwordHash, plainText);
