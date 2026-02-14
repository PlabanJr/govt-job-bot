export function isOptOutMessage(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return normalized === "stop" || normalized === "unsubscribe" || normalized === "opt out";
}
