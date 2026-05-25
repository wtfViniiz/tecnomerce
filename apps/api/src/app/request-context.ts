import type { Logger } from "pino";

declare global {
  namespace Express {
    interface Request {
      context: {
        traceId: string;
        requestId: string;
        userId?: string;
        sessionId?: string;
        permissions?: string[];
      };
      log: Logger;
    }
  }
}

export {};
