export type SessionView = {
  id: string;
  chainId: string;
  expiresAt: string;
  lastUsedAt: string | null;
  isCurrent: boolean;
  isTwoFactorVerified: boolean;
  stepUpVerifiedAt: string | null;
  deviceName: string | null;
  ipAddress: string | null;
  userAgent: string | null;
};

export type LoginSuccessDto = {
  accessToken: string;
  session: SessionView;
};

export type UserView = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type MeDto = {
  user: UserView;
  session: SessionView;
  permissions: string[];
  flags: {
    twoFaEnabled: boolean;
    isTwoFactorVerified: boolean;
    stepUpActive: boolean;
  };
};
