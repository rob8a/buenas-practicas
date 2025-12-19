import express from "express";
import cors from "cors";
import helmet from "helmet";

import v1Routes from "./v1/routes/index.js";
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";

import authRoutes from "./v1/auth/auth.routes.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  // API versionada
  app.use("/api/v1", v1Routes);

  app.use("/api/v1/auth", authRoutes);

  // 404 + error handler
  app.use(notFound);
  app.use(errorHandler);

  return app;
}