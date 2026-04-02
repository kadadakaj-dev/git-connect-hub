import "reflect-metadata";
import * as dotenv from "dotenv";
dotenv.config();

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { configureApp } from "./app-setup";
import * as Sentry from "@sentry/node";
import { logStructured } from "./structured-logger";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    environment: process.env.APP_ENV ?? process.env.NODE_ENV
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  await app.listen(port);
  logStructured("info", "api_started", { port });
}

bootstrap().catch((error) => {
  logStructured("error", "bootstrap_failed", { error: error instanceof Error ? error.message : String(error) });
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error);
  }
  process.exit(1);
});
