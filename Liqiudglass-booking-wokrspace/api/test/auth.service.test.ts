import { UnauthorizedException } from "@nestjs/common";
import { AuthService } from "../src/auth/auth.service";

describe("AuthService", () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    oauthAccount: {
      findUnique: jest.fn(),
      create: jest.fn()
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn()
    },
    session: {
      create: jest.fn(),
      findMany: jest.fn()
    },
    tokenBlacklist: {
      findUnique: jest.fn(),
      create: jest.fn()
    }
  } as any;

  const jwtService = {
    signAsync: jest.fn().mockResolvedValue("access-token"),
    verifyAsync: jest.fn().mockResolvedValue({ sub: "user_1", email: "a@b.com" }),
    decode: jest.fn().mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 600 })
  } as any;

  const service = new AuthService(prisma, jwtService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("refresh rejects expired tokens", async () => {
    prisma.refreshToken.findUnique.mockResolvedValue({
      token: "hashed",
      isRevoked: false,
      expiresAt: new Date(Date.now() - 1000),
      user: { id: "u1", email: "e@e.com" }
    });

    await expect(service.refresh("rt", "127.0.0.1")).rejects.toBeInstanceOf(
      UnauthorizedException
    );
  });

  it("biometric setup keeps password fallback", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "u1" });
    prisma.user.update.mockResolvedValue({ id: "u1", biometricId: "cred" });

    const result = await service.biometric({ userId: "u1", credentialId: "cred" });
    expect(result.fallback).toBe("password");
  });
  it("mocks oauth providers", async () => {
    prisma.oauthAccount.findUnique.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue({ id: "u1", email: "google.demo@booking.local" });
    prisma.oauthAccount.create.mockResolvedValue({
      user: { id: "u1", email: "google.demo@booking.local" }
    });
    prisma.refreshToken.create.mockResolvedValue({});
    prisma.session.create.mockResolvedValue({});

    const result = await service.loginWithOAuth(
      { provider: "google", providerAccountId: "pid", email: "google.demo@booking.local" },
      "127.0.0.1"
    );

    expect(result.accessToken).toBe("access-token");
  });

});
