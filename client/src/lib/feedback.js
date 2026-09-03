export function isBlankFeedback(message) {
  return typeof message !== "string" || message.trim().length === 0;
}
