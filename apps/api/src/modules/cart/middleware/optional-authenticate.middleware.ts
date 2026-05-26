import type { NextFunction, Request, Response } from "express";

import type { IRbacProvider, ISessionProvider, ITokenProvider, IUserProvider } from "@/providers/contracts.js";

/**
 * Optional authentication middleware for routes that support both
 * authenticated and guest access (e.g., cart).
 * Sets userId/permissions if token is valid, otherwise continues without.
 */
export const createOptionalAuthenticateMiddleware =
  (
    tokenProvider: ITokenProvider,
    userProvider: IUserProvider,
    sessionProvider: ISessionProvider,
    rbacProvider: IRbacProvider
  ) =>
  async (request: Request, _response: Response, next: NextFunction): Promise<void> => {
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
      next();
      return;
    }

    try {
      const token = authorization.replace("Bearer ", "");
      const payload = await tokenProvider.verifyAccessToken(token);
      const user = await userProvider.findById(payload.sub);
      const session = await sessionProvider.findSessionById(payload.sessionId);

      if (
        user &&
        session &&
        session.userId === user.id &&
        !session.revokedAt &&
        !session.compromisedAt &&
        session.expiresAt > new Date() &&
        user.tokenVersion === payload.tokenVersion
      ) {
        request.context.userId = user.id;
        request.context.sessionId = session.id;
        request.context.permissions = await rbacProvider.getUserPermissions(session.id, user.id);
        request.log = request.log.child({
          userId: user.id,
          sessionId: session.id
        });
      }
    } catch {
      // Token invalid — continue as guest
    }

    next();
  };
