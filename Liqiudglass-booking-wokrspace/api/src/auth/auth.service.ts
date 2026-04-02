import {
  BadRequestException,
  Injectable,
  HttpException,
  UnauthorizedException
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma.service";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { authenticator } from "otplib";
import { BiometricDto, LoginDto, OAuthLoginDto, RegisterDto } from "./dto/auth.dto";

const ACCESS_TTL_SECONDS = 60 * 15;
const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 14;

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) { }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new BadRequestException("User already exists");
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        salt
      }
    });

    return this.issueTokens(user.id, dto.email, { rememberMe: false });
  }

  async login(dto: LoginDto, ipAddress: string, userAgent?: string) {
    await this.assertRateLimit(ipAddress);

    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user?.passwordHash) {
      await this.registerFailedAttempt(ipAddress);
      throw new UnauthorizedException("Invalid credentials");
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      await this.registerFailedAttempt(ipAddress);
      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.twoFaSecret) {
      if (!dto.twoFaCode || !authenticator.verify({ token: dto.twoFaCode, secret: user.twoFaSecret })) {
        throw new UnauthorizedException("2FA required or invalid");
      }
    }

    return this.issueTokens(user.id, user.email, {
      rememberMe: Boolean(dto.rememberMe),
      ipAddress,
      userAgent
    });
  }

  async loginWithOAuth(dto: OAuthLoginDto, ipAddress: string, userAgent?: string) {
    const provider = dto.provider.toLowerCase();
    if (!["google", "github", "apple"].includes(provider)) {
      throw new BadRequestException("Unsupported provider");
    }

    let account = await this.prisma.oauthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId: dto.providerAccountId
        }
      },
      include: { user: true }
    });

    if (!account) {
      let user = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (!user) {
        user = await this.prisma.user.create({ data: { email: dto.email } });
      }
      account = await this.prisma.oauthAccount.create({
        data: {
          provider,
          providerAccountId: dto.providerAccountId,
          userId: user.id
        },
        include: { user: true }
      });
    }

    return this.issueTokens(account.user.id, account.user.email, {
      rememberMe: true,
      ipAddress,
      userAgent
    });
  }

  async refresh(refreshToken: string, ipAddress: string, userAgent?: string) {
    const token = await this.prisma.refreshToken.findUnique({
      where: { token: this.hashToken(refreshToken) },
      include: { user: true }
    });

    if (!token || token.isRevoked || token.expiresAt < new Date()) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    await this.prisma.refreshToken.update({
      where: { token: token.token },
      data: { isRevoked: true }
    });

    return this.issueTokens(token.user.id, token.user.email, {
      rememberMe: true,
      ipAddress,
      userAgent
    });
  }

  async logout(accessToken: string, refreshToken?: string) {
    const payload = this.jwtService.decode(accessToken) as { exp?: number } | null;
    if (payload?.exp) {
      await this.prisma.tokenBlacklist.create({
        data: {
          token: this.hashToken(accessToken),
          expiresAt: new Date(payload.exp * 1000)
        }
      });
    }

    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { token: this.hashToken(refreshToken) },
        data: { isRevoked: true }
      });
    }
  }

  async verify(accessToken: string) {
    // Note: In a real Supabase integration, you'd use the Supabase JWT Secret.
    // For local dev, we assume JWT_ACCESS_SECRET is set to the Supabase JWT Secret.
    try {
      const payload = await this.jwtService.verifyAsync(accessToken, {
        secret: process.env.JWT_ACCESS_SECRET
      });
      return payload;
    } catch (e) {
      throw new UnauthorizedException("Invalid token");
    }
  }

  async create2faSecret(userId: string) {
    const secret = authenticator.generateSecret();
    await this.prisma.user.update({ where: { id: userId }, data: { twoFaSecret: secret } });
    return {
      secret,
      otpauthUrl: authenticator.keyuri(userId, "UBM Booking", secret)
    };
  }

  async enforce2fa(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFaSecret) {
      throw new BadRequestException("2FA not initialized");
    }

    const verified = authenticator.verify({ token, secret: user.twoFaSecret });
    if (!verified) {
      throw new UnauthorizedException("Invalid 2FA token");
    }

    return { enabled: true };
  }

  async biometric(dto: BiometricDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) {
      throw new UnauthorizedException("Unknown user");
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { biometricId: dto.credentialId }
    });

    return { registered: true, fallback: "password" };
  }

  async sessions(userId: string) {
    return this.prisma.session.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  }

  private async issueTokens(
    userId: string,
    email: string,
    options: { rememberMe: boolean; ipAddress?: string; userAgent?: string }
  ) {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId, email, amr: ["pwd"] },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: `${ACCESS_TTL_SECONDS}s`
      }
    );

    const refreshTokenRaw = crypto.randomBytes(48).toString("hex");
    const refreshExpiresIn = options.rememberMe ? REFRESH_TTL_SECONDS : 60 * 60 * 24;
    await this.prisma.refreshToken.create({
      data: {
        token: this.hashToken(refreshTokenRaw),
        userId,
        expiresAt: new Date(Date.now() + refreshExpiresIn * 1000)
      }
    });

    await this.prisma.session.create({
      data: {
        token: this.hashToken(accessToken),
        userId,
        expiresAt: new Date(Date.now() + ACCESS_TTL_SECONDS * 1000),
        ipAddress: options.ipAddress ?? "0.0.0.0",
        userAgent: options.userAgent
      }
    });

    return {
      accessToken,
      refreshToken: refreshTokenRaw,
      expiresIn: ACCESS_TTL_SECONDS,
      tokenType: "Bearer"
    };
  }

  private async registerFailedAttempt(ip: string) {
    await this.prisma.auditLog.create({
      data: {
        action: "LOGIN_FAILED",
        meta: { ip }
      }
    });
  }

  private async assertRateLimit(ip: string) {
    const cutoff = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
    const count = await this.prisma.auditLog.count({
      where: {
        action: "LOGIN_FAILED",
        createdAt: { gte: cutoff },
        meta: { path: ["ip"], equals: ip }
      }
    });
    if (count >= RATE_LIMIT_MAX_ATTEMPTS) {
      throw new HttpException("Too many login attempts", 429);
    }
  }

  private hashToken(value: string) {
    return crypto.createHash("sha256").update(value).digest("hex");
  }
}
