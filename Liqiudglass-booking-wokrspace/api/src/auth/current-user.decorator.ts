import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): { userId: string; email: string } | null => {
    const req = ctx.switchToHttp().getRequest();
    return req.user ?? null;
  }
);
