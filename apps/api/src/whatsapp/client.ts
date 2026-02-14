import { config } from "../config";

export interface SendTemplateMessageInput {
  to: string;
  templateName: string;
  languageCode: "en_US" | "hi";
  bodyParameters: string[];
}

export interface SendTextMessageInput {
  to: string;
  text: string;
}

export interface ReplyButton {
  id: string;
  title: string;
}

export interface ListRow {
  id: string;
  title: string;
  description?: string;
}

export interface ListSection {
  title: string;
  rows: ListRow[];
}

export interface SendReplyButtonsInput {
  to: string;
  bodyText: string;
  buttons: ReplyButton[];
}

export interface SendListMessageInput {
  to: string;
  bodyText: string;
  buttonText: string;
  sections: ListSection[];
}

export async function sendTemplateMessage(input: SendTemplateMessageInput) {
  const url = `${config.whatsapp.apiBaseUrl}/${config.whatsapp.phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.whatsapp.accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: input.to,
      type: "template",
      template: {
        name: input.templateName,
        language: { code: input.languageCode },
        components: [
          {
            type: "body",
            parameters: input.bodyParameters.map((text) => ({ type: "text", text }))
          }
        ]
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WhatsApp send failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function sendTextMessage(input: SendTextMessageInput) {
  const url = `${config.whatsapp.apiBaseUrl}/${config.whatsapp.phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.whatsapp.accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: input.to,
      type: "text",
      text: { body: input.text }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WhatsApp send failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function sendReplyButtons(input: SendReplyButtonsInput) {
  const url = `${config.whatsapp.apiBaseUrl}/${config.whatsapp.phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.whatsapp.accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: input.to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: input.bodyText },
        action: {
          buttons: input.buttons.map((button) => ({
            type: "reply",
            reply: { id: button.id, title: button.title }
          }))
        }
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WhatsApp send failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function sendListMessage(input: SendListMessageInput) {
  const url = `${config.whatsapp.apiBaseUrl}/${config.whatsapp.phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.whatsapp.accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: input.to,
      type: "interactive",
      interactive: {
        type: "list",
        body: { text: input.bodyText },
        action: {
          button: input.buttonText,
          sections: input.sections.map((section) => ({
            title: section.title,
            rows: section.rows.map((row) => ({
              id: row.id,
              title: row.title,
              description: row.description
            }))
          }))
        }
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WhatsApp send failed: ${response.status} ${errorText}`);
  }

  return response.json();
}
