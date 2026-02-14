import type { DigestPayload } from "../digest/types";

export interface MockSendResult {
  to: string;
  payload: DigestPayload;
}

export interface WhatsAppSender {
  sendDigest: (to: string, payload: DigestPayload) => Promise<MockSendResult>;
}

export function createMockSender(collected: MockSendResult[]): WhatsAppSender {
  return {
    async sendDigest(to, payload) {
      const result = { to, payload };
      collected.push(result);
      return result;
    }
  };
}
