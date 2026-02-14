import Fastify from "fastify";
import { webhookRoutes } from "./routes/webhook";
import { adminRoutes } from "./routes/admin";

export function buildServer() {
  const app = Fastify({ logger: true });

  app.get("/health", async () => ({ status: "ok" }));
  app.register(webhookRoutes, { prefix: "/webhook" });
  app.register(adminRoutes, { prefix: "/admin" });

  return app;
}
