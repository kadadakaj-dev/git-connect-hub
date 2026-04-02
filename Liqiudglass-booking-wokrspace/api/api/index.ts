import "reflect-metadata";
import * as dotenv from "dotenv";
dotenv.config();
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app-setup";
import { ExpressAdapter } from "@nestjs/platform-express";
import express from "express";

const server = express();

const promise = (async () => {
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
        logger: ["error", "warn", "log"],
    });
    configureApp(app);
    await app.init();
})();

export default async (req: any, res: any) => {
    try {
        await promise;
        server(req, res);
    } catch (error) {
        console.error("NestJS bootstrap failed:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
