import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { timingSafeEqual } from "crypto";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.API_KEY;
    if (!expected) {
      // Fail closed: if the env var is not set, reject all requests instead of
      // silently allowing them.  This prevents accidental open access in
      // misconfigured environments.
      throw new UnauthorizedException("API key is not configured on the server");
    }

    const request = context.switchToHttp().getRequest();
    const provided = String(request.headers["x-api-key"] ?? "");

    // Use timing-safe comparison to prevent timing-based key enumeration.
    const buf1 = Buffer.from(provided.padEnd(expected.length));
    const buf2 = Buffer.from(expected);
    const match =
      buf1.length === buf2.length && timingSafeEqual(buf1, buf2);

    if (!match) throw new UnauthorizedException("Invalid API key");
    return true;
  }
}
