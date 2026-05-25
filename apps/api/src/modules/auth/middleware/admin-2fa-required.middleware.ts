import type { NextFunction, Request, Response } from "express";

import { AuthError } from "@/core/errors/auth-error.js";
import { RbacError } from "@/core/errors/rbac-error.js";
import type { AuthService } from "@/modules/auth/services/auth.service.js";
import type { ISessionProvider, IUserProvider } from "@/providers/contracts.js";

export const createAdmin2faRequiredMiddleware =
  (authService: AuthService, userProvider: IUserProvider, sessionProvider: ISessionProvider) =>
  async (request: Request, _response: Response, next: NextFunction): Promise<void> => {
    const userId = request.context.userId;
    const sessionId = request.context.sessionId;
    if (!userId || !sessionId) {
      next(new AuthError("AUTH.UNAUTHENTICATED", "Authentication required."));
      return;
    }

    const [user, session] = await Promise.all([
      userProvider.findById(userId),
      sessionProvider.findSessionById(sessionId)
    ]);

    if (!user || !session) {
      next(new AuthError("AUTH.UNAUTHENTICATED", "Authentication required."));
      return;
    }

    if (!user.twoFaEnabled || !session.isTwoFactorVerified) {
      next(new RbacError("RBAC.ADMIN_TWO_FA_REQUIRED", "Admin 2FA verification required."));
      return;
    }

    if (!authService.isStepUpActive(session)) {
      next(new RbacError("RBAC.STEP_UP_REQUIRED", "Recent step-up verification required."));
      return;
    }

    next();
  };
