import "reflect-metadata";
import * as dotenv from "dotenv";
dotenv.config();

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { configureApp } from "./app-setup";
import { IncomingMessage, ServerResponse } from "http";

let app: any;

async function getApp() {
  if (!app) {
    app = await NestFactory.create(AppModule, {
      logger: ["error", "warn"]
    });
    configureApp(app);
    await app.init();
  }
  return app;
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  const nestApp = await getApp();
  const expressInstance = nestApp.getHttpAdapter().getInstance();
  expressInstance(req, res);
}
