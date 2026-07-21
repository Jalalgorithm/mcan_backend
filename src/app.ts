import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { swaggerSpec } from "./config/swagger";
import { globalRateLimiter } from "./middleware/rateLimiter";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

import { authRouter } from "./modules/auth/auth.routes";
import { membersRouter } from "./modules/members/members.routes";
import { newsRouter } from "./modules/news/news.routes";
import { eventsRouter } from "./modules/events/events.routes";
import { contactRouter } from "./modules/contact/contact.routes";
import { adminUsersRouter } from "./modules/admin-users/admin-users.routes";
import { digitalIdRouter } from "./modules/digital-id/digital-id.routes";
import { uploadRouter } from "./modules/upload/upload.routes";
import { statsRouter } from "./modules/stats/stats.routes";
import { donationsRouter } from "./modules/donations/donations.routes";
import { executivesRouter } from "./modules/executives/executives.routes";
import { galleryRouter } from "./modules/gallery/gallery.routes";
import { lodgesRouter } from "./modules/lodges/lodges.routes";
import { webContentRouter } from "./modules/webcontent/webcontent.routes";
import { programsRouter } from "./modules/programs/programs.routes";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(pinoHttp({ logger }));
  app.use(globalRateLimiter);

  if (env.SWAGGER_ENABLED) {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  }

  app.get("/health", (_req, res) => res.json({ success: true, message: "OK" }));

  app.use("/api/auth", authRouter);
  app.use("/api/members", membersRouter);
  app.use("/api/news", newsRouter);
  app.use("/api/events", eventsRouter);
  app.use("/api/contact", contactRouter);
  app.use("/api/admin-users", adminUsersRouter);
  app.use("/api/digital-id", digitalIdRouter);
  app.use("/api/upload", uploadRouter);
  app.use("/api/admin", statsRouter);
  app.use("/api/donations", donationsRouter);
  app.use("/api/executives", executivesRouter);
  app.use("/api/gallery", galleryRouter);
  app.use("/api/lodges", lodgesRouter);
  app.use("/api/webcontent", webContentRouter);
  app.use("/api/programs", programsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
