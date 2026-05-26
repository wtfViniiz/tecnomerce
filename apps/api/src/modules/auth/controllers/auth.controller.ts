import type { Request, Response } from "express";

import { authConfig } from "@/config/auth.js";
import { successResponse } from "@/core/api/api-envelope.js";
import { AuthError } from "@/core/errors/auth-error.js";
import type { MeDto, SessionView } from "@/modules/auth/dto/auth.dto.js";
import type { AuthService } from "@/modules/auth/services/auth.service.js";

const toSessionView = (session: {
  id: string;
  chainId: string;
  expiresAt: Date;
  lastUsedAt: Date | null;
  isTwoFactorVerified: boolean;
  stepUpVerifiedAt: Date | null;
  deviceName: string | null;
  ipAddress: string | null;
  userAgent: string | null;
}): SessionView => ({
  id: session.id,
  chainId: session.chainId,
  expiresAt: session.expiresAt.toISOString(),
  lastUsedAt: session.lastUsedAt?.toISOString() ?? null,
  isCurrent: false,
  isTwoFactorVerified: session.isTwoFactorVerified,
  stepUpVerifiedAt: session.stepUpVerifiedAt?.toISOString() ?? null,
  deviceName: session.deviceName,
  ipAddress: session.ipAddress,
  userAgent: session.userAgent
});

const buildContext = (request: Request) => ({
  traceId: request.context.traceId,
  requestId: request.context.requestId,
  ipAddress: request.ip ?? "0.0.0.0",
  userAgent: request.headers["user-agent"] ?? "",
  deviceName:
    typeof request.headers["x-device-name"] === "string"
      ? request.headers["x-device-name"]
      : null
});

export class AuthController {
  public constructor(private readonly authService: AuthService) {}

  public login = async (request: Request, response: Response): Promise<void> => {
    const result = await this.authService.login({
      email: request.body.email,
      password: request.body.password,
      twoFaToken: request.body.twoFaToken,
      context: buildContext(request)
    });

    if (result.requiresTwoFactor) {
      response.status(202).json(
        successResponse(request.context.traceId, {
          requiresTwoFactor: true
        })
      );
      return;
    }

    response.cookie(authConfig.refreshCookieName, result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: authConfig.refreshCookiePath,
      maxAge: authConfig.refreshSessionTtlDays * 24 * 60 * 60 * 1000
    });

    response.json(
      successResponse(request.context.traceId, {
        accessToken: result.accessToken,
        session: {
          ...toSessionView(result.session),
          isCurrent: true
        }
      })
    );
  };

  public register = async (request: Request, response: Response): Promise<void> => {
    const result = await this.authService.register({
      name: request.body.name,
      email: request.body.email,
      password: request.body.password,
      context: buildContext(request)
    });

    response.cookie(authConfig.refreshCookieName, result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: authConfig.refreshCookiePath,
      maxAge: authConfig.refreshSessionTtlDays * 24 * 60 * 60 * 1000
    });

    response.status(201).json(
      successResponse(request.context.traceId, {
        accessToken: result.accessToken,
        session: {
          ...toSessionView(result.session),
          isCurrent: true
        }
      })
    );
  };

  public refresh = async (request: Request, response: Response): Promise<void> => {
    const rawRefreshToken = request.cookies[authConfig.refreshCookieName] as string | undefined;
    if (!rawRefreshToken) {
      response.clearCookie(authConfig.refreshCookieName, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: authConfig.refreshCookiePath
      });
      throw new AuthError("AUTH.MISSING_REFRESH_TOKEN", "Missing refresh token.");
    }

    const result = await this.authService.refresh({
      rawRefreshToken,
      context: buildContext(request)
    });

    response.cookie(authConfig.refreshCookieName, result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: authConfig.refreshCookiePath,
      maxAge: authConfig.refreshSessionTtlDays * 24 * 60 * 60 * 1000
    });

    response.json(
      successResponse(request.context.traceId, {
        accessToken: result.accessToken,
        session: {
          ...toSessionView(result.session),
          isCurrent: true
        }
      })
    );
  };

  public logout = async (request: Request, response: Response): Promise<void> => {
    await this.authService.logout(
      request.context.userId!,
      request.context.sessionId!,
      buildContext(request)
    );

    response.clearCookie(authConfig.refreshCookieName, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: authConfig.refreshCookiePath
    });

    response.json(successResponse(request.context.traceId, { success: true }));
  };

  public logoutAll = async (request: Request, response: Response): Promise<void> => {
    const me = await this.authService.me(request.context.userId!, request.context.sessionId!);
    await this.authService.logoutAll(
      me.user.id,
      me.user.tokenVersion,
      buildContext(request)
    );

    response.clearCookie(authConfig.refreshCookieName, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: authConfig.refreshCookiePath
    });

    response.json(successResponse(request.context.traceId, { success: true }));
  };

  public listSessions = async (request: Request, response: Response): Promise<void> => {
    const sessions = await this.authService.listSessions(request.context.userId!);

    response.json(
      successResponse(
        request.context.traceId,
        sessions.map((session) => ({
          ...toSessionView(session),
          isCurrent: session.id === request.context.sessionId
        }))
      )
    );
  };

  public revokeSession = async (request: Request, response: Response): Promise<void> => {
    await this.authService.revokeSession(
      request.context.userId!,
      {
        actorSessionId: request.context.sessionId!,
        targetSessionId: String(request.params.sessionId),
        confirmCurrentSession: request.body.confirmCurrentSession
      },
      buildContext(request)
    );

    response.json(successResponse(request.context.traceId, { success: true }));
  };

  public enrollTwoFactor = async (request: Request, response: Response): Promise<void> => {
    const enrollment = await this.authService.enrollTwoFactor(
      request.context.userId!,
      buildContext(request)
    );

    response.json(successResponse(request.context.traceId, enrollment));
  };

  public verifyTwoFactor = async (request: Request, response: Response): Promise<void> => {
    const result = await this.authService.verifyTwoFactorEnrollment(
      request.context.userId!,
      String(request.body.token),
      buildContext(request)
    );

    response.json(successResponse(request.context.traceId, result));
  };

  public disableTwoFactor = async (request: Request, response: Response): Promise<void> => {
    await this.authService.disableTwoFactor({
      userId: request.context.userId!,
      currentPassword: request.body.currentPassword,
      token: String(request.body.token),
      context: buildContext(request)
    });

    response.json(successResponse(request.context.traceId, { success: true }));
  };

  public stepUp = async (request: Request, response: Response): Promise<void> => {
    const session = await this.authService.stepUp({
      userId: request.context.userId!,
      sessionId: request.context.sessionId!,
      token: String(request.body.token),
      context: buildContext(request)
    });

    response.json(
      successResponse(request.context.traceId, {
        session: {
          ...toSessionView(session),
          isCurrent: true
        }
      })
    );
  };

  public me = async (request: Request, response: Response): Promise<void> => {
    const me = await this.authService.me(request.context.userId!, request.context.sessionId!);
    const payload: MeDto = {
      session: {
        ...toSessionView(me.session),
        isCurrent: true
      },
      permissions: me.permissions,
      flags: {
        twoFaEnabled: me.user.twoFaEnabled,
        isTwoFactorVerified: me.session.isTwoFactorVerified,
        stepUpActive: this.authService.isStepUpActive(me.session)
      }
    };

    response.json(successResponse(request.context.traceId, payload));
  };
}
