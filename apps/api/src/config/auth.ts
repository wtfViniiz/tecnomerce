export const authConfig = {
  accessTokenTtlMinutes: 15,
  refreshCookieName: "coremd_refresh_token",
  refreshCookiePath: "/api/v1/auth",
  refreshSessionTtlDays: 30,
  stepUpTtlMinutes: 15
} as const;
