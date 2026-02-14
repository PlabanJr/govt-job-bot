import { URL } from "node:url";

export function resolveUrl(baseUrl: string, href: string | undefined): string | null {
  if (!href) return null;
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

export function cleanText(text: string | undefined): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}
