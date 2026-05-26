import { generateKeyPairSync, randomBytes } from "node:crypto";

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048
});

process.env.NODE_ENV = "test";
process.env.APP_ENV = "test";
process.env.PORT = "3333";
process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/coremd_test";
process.env.REDIS_URL = "redis://localhost:6379";
process.env.JWT_PRIVATE_KEY = privateKey.export({ format: "pem", type: "pkcs8" }).toString();
process.env.JWT_PUBLIC_KEY = publicKey.export({ format: "pem", type: "spki" }).toString();
process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";
process.env.TWO_FA_ENCRYPTION_KEY = randomBytes(32).toString("base64");
process.env.MP_ACCESS_TOKEN = "TEST-token";
process.env.MP_PUBLIC_KEY = "TEST-public-key";
process.env.MP_WEBHOOK_SECRET = "test-webhook-secret";
process.env.MP_API_BASE_URL = "https://api.mercadopago.com";
