import type { FastifyInstance } from "fastify";
import { config } from "../config";
import { handleIncomingPayload } from "../whatsapp/handler";

export async function webhookRoutes(app: FastifyInstance) {
  app.get("/", async (req, reply) => {
    const query = req.query as Record<string, string | undefined>;
    const mode = query["hub.mode"];
    const token = query["hub.verify_token"];
    const challenge = query["hub.challenge"];

    if (mode === "subscribe" && token === config.whatsapp.verifyToken && challenge) {
      reply.status(200).send(challenge);
      return;
    }

    reply.status(403).send({ error: "Verification failed" });
  });

  app.post("/", async (req, reply) => {
    // TODO: verify webhook signature when enabling production traffic
    const payload = req.body as Record<string, unknown>;

    app.log.info({ payload }, "Incoming WhatsApp webhook");

    await handleIncomingPayload(payload);
    reply.status(200).send({ status: "received" });
  });
}
