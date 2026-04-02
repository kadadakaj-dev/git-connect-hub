import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "../auth.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) { }

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();

    // 1) Try cookie-based auth first
    let token = req.cookies?.access_token as string | undefined;

    // 2) Fall back to Authorization header (API clients, mobile)
    if (!token) {
      const authHeader = req.headers.authorization as string | undefined;
      if (authHeader?.startsWith("Bearer ")) {
        token = authHeader.slice(7);
      }
    }

    if (!token) {
      throw new UnauthorizedException("Missing authentication");
    }

    const payload = await this.authService.verify(token);
    req.user = { userId: payload.sub as string, email: payload.email as string };
    req.accessToken = token;
    return true;
  }
}
