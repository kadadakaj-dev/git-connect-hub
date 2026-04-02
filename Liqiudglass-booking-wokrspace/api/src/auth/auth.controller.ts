import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards
} from "@nestjs/common";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import {
  BiometricDto,
  LoginDto,
  OAuthLoginDto,
  RegisterDto,
  Setup2faDto
} from "./dto/auth.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser } from "./current-user.decorator";

const COOKIE_OPTIONS_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/"
};

function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string; expiresIn: number },
  rememberMe: boolean
) {
  res.cookie("access_token", tokens.accessToken, {
    ...COOKIE_OPTIONS_BASE,
    maxAge: tokens.expiresIn * 1000
  });

  res.cookie("refresh_token", tokens.refreshToken, {
    ...COOKIE_OPTIONS_BASE,
    path: "/auth/refresh",
    maxAge: rememberMe ? 14 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
  });
}

function clearAuthCookies(res: Response) {
  res.clearCookie("access_token", { ...COOKIE_OPTIONS_BASE });
  res.clearCookie("refresh_token", { ...COOKIE_OPTIONS_BASE, path: "/auth/refresh" });
}

@Controller("/auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("/register")
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.register(dto);
    setAuthCookies(res, tokens, false);
    return { expiresIn: tokens.expiresIn, tokenType: tokens.tokenType };
  }

  @Post("/login")
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const tokens = await this.authService.login(dto, req.ip ?? "0.0.0.0", req.headers["user-agent"]);
    setAuthCookies(res, tokens, Boolean(dto.rememberMe));
    return { expiresIn: tokens.expiresIn, tokenType: tokens.tokenType };
  }

  @Post("/oauth")
  @HttpCode(200)
  async oauth(
    @Body() dto: OAuthLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const tokens = await this.authService.loginWithOAuth(dto, req.ip ?? "0.0.0.0", req.headers["user-agent"]);
    setAuthCookies(res, tokens, true);
    return { expiresIn: tokens.expiresIn, tokenType: tokens.tokenType };
  }

  @Post("/refresh")
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException("Missing refresh token");
    }
    const tokens = await this.authService.refresh(refreshToken, req.ip ?? "0.0.0.0", req.headers["user-agent"]);
    setAuthCookies(res, tokens, true);
    return { expiresIn: tokens.expiresIn, tokenType: tokens.tokenType };
  }

  @Post("/logout")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const accessToken = req.cookies?.access_token;
    const refreshToken = req.cookies?.refresh_token;
    if (accessToken) {
      await this.authService.logout(accessToken, refreshToken);
    }
    clearAuthCookies(res);
    return { ok: true };
  }

  @Get("/verify")
  @UseGuards(JwtAuthGuard)
  verify(@CurrentUser() user: { userId: string; email: string }) {
    return { valid: true, user };
  }

  @Post("/2fa/setup")
  @UseGuards(JwtAuthGuard)
  setup2fa(@CurrentUser() user: { userId: string }) {
    return this.authService.create2faSecret(user.userId);
  }

  @Post("/2fa/enforce")
  @UseGuards(JwtAuthGuard)
  enforce2fa(
    @CurrentUser() user: { userId: string },
    @Body() dto: Setup2faDto
  ) {
    return this.authService.enforce2fa(user.userId, dto.token);
  }

  @Post("/biometric")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  biometric(
    @CurrentUser() user: { userId: string },
    @Body() dto: BiometricDto
  ) {
    // Force userId from the verified JWT — never trust the request body.
    return this.authService.biometric({ ...dto, userId: user.userId });
  }

  @Get("/sessions")
  @UseGuards(JwtAuthGuard)
  sessions(@CurrentUser() user: { userId: string }) {
    return this.authService.sessions(user.userId);
  }
}
