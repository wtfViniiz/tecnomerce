import { createHash, createPrivateKey, createPublicKey, randomBytes } from "node:crypto";

import argon2 from "argon2";
import jwt from "jsonwebtoken";

import { env } from "@/config/env.js";
import type { AccessTokenPayload, ITokenProvider } from "@/providers/contracts.js";

const privateKey = createPrivateKey(env.JWT_PRIVATE_KEY);
const publicKey = createPublicKey(env.JWT_PUBLIC_KEY);

export class JwtTokenProvider implements ITokenProvider {
  public async signAccessToken(payload: AccessTokenPayload): Promise<string> {
    return jwt.sign(payload, privateKey, {
      algorithm: "RS256",
      expiresIn: `${env.ACCESS_TOKEN_TTL_MINUTES}m`
    });
  }

  public async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    return jwt.verify(token, publicKey, {
      algorithms: ["RS256"]
    }) as AccessTokenPayload;
  }

  public async generateRefreshToken(): Promise<string> {
    return randomBytes(32).toString("hex");
  }

  public async generateRefreshTokenLookupHash(rawToken: string): Promise<string> {
    return createHash("sha256").update(rawToken).digest("hex");
  }

  public async hashRefreshToken(rawToken: string): Promise<string> {
    return argon2.hash(rawToken, {
      type: argon2.argon2id
    });
  }

  public async verifyRefreshTokenHash(rawToken: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, rawToken);
  }
}
