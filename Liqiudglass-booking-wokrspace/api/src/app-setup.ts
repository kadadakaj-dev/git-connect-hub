import { INestApplication, ValidationPipe } from "@nestjs/common";
import { ApiKeyGuard } from "./api-key.guard";
import { GlobalErrorFilter } from "./global-error.filter";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import * as crypto from "node:crypto";
import { NextFunction, Request, Response } from "express";
import { logStructured } from "./structured-logger";

export function configureApp(app: INestApplication) {
  const origins = (process.env.CORS_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        origins.includes(origin) ||
        origin.startsWith("http://localhost:")
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["content-type", "authorization", "x-api-key", "x-csrf-token", "idempotency-key"]
  });

  app.use(cookieParser());

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: []
        }
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    })
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true
    })
  );

  // CSRF protection using Double Submit Cookie pattern
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    if (req.method === "GET" && req.path === "/auth/csrf") {
      const token = crypto.randomBytes(32).toString("hex");
      res.cookie("__csrf", token, {
        httpOnly: false,
        secure: true, // Always secure in production/serverless
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 1000 // 1 hour
      });
      return res.json({ csrfToken: token });
    }

    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method) && req.path.startsWith("/auth")) {
      const headerToken = req.headers["x-csrf-token"] as string | undefined;
      const cookieToken = req.cookies?.__csrf as string | undefined;

      if (!headerToken || !cookieToken) {
        return res.status(403).json({ error: { message: "Missing CSRF token", status: 403 } });
      }

      if (headerToken.length !== cookieToken.length) {
        return res.status(403).json({ error: { message: "Invalid CSRF token", status: 403 } });
      }

      const headerBuf = Buffer.from(headerToken, "utf-8");
      const cookieBuf = Buffer.from(cookieToken, "utf-8");
      if (!crypto.timingSafeEqual(headerBuf, cookieBuf)) {
        return res.status(403).json({ error: { message: "Invalid CSRF token", status: 403 } });
      }
    }

    res.on("finish", () => {
      logStructured("info", "http_request", {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: Date.now() - start,
        requestId: req.headers["x-request-id"] ?? null
      });
    });

    next();
  });

  app.useGlobalGuards(new ApiKeyGuard());
  app.useGlobalFilters(new GlobalErrorFilter());
}
