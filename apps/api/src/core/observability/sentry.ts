import * as Sentry from "@sentry/node";

type SentryConfig = {
  dsn: string;
  environment: string;
  tracesSampleRate: number;
};

let initialized = false;

export function initSentry(config: SentryConfig): void {
  if (!config.dsn || initialized) return;

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    tracesSampleRate: config.tracesSampleRate,
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers["authorization"];
        delete event.request.headers["cookie"];
      }
      if (event.request?.data && typeof event.request.data === "object") {
        const data = event.request.data as Record<string, unknown>;
        delete data.password;
        delete data.passwordHash;
        delete data.token;
        delete data.refreshToken;
        delete data.twoFaSecret;
      }
      return event;
    }
  });

  initialized = true;
}

export function captureSentryError(error: Error, context?: Record<string, unknown>): void {
  if (!initialized) return;
  Sentry.captureException(error, context);
}

export { Sentry };
