// Turns an Anthropic SDK error into a message worth showing a user, instead
// of the raw JSON error body (which is what `.message` often is).
import {
  APIConnectionTimeoutError,
  APIError,
  AuthenticationError,
  NotFoundError,
  PermissionDeniedError,
  RateLimitError,
} from "@anthropic-ai/sdk";

export function friendlyAnthropicError(e: unknown): string {
  if (e instanceof APIConnectionTimeoutError) {
    return "That request took too long to complete — likely because there's a lot to analyze. Try a shorter transcript, or split it into a couple of smaller ones.";
  }
  if (e instanceof NotFoundError) {
    const detail = errorDetailMessage(e);
    if (detail && /model/i.test(detail)) {
      return `The configured model isn't available to this API key (${detail}). In your deploy's environment variables, set ANTHROPIC_MODEL to a model this key can access, or check model access in the Anthropic Console.`;
    }
    return detail || "The Anthropic API returned a 404 for this request.";
  }
  if (e instanceof AuthenticationError) {
    return "The Anthropic API key is missing or invalid. Check ANTHROPIC_API_KEY in your environment variables.";
  }
  if (e instanceof PermissionDeniedError) {
    return "This Anthropic API key doesn't have permission for this request.";
  }
  if (e instanceof RateLimitError) {
    return "Rate limited by the Anthropic API — wait a moment and try again.";
  }
  if (e instanceof APIError) {
    return errorDetailMessage(e) || e.message || "The Anthropic API returned an error.";
  }
  return e instanceof Error ? e.message : "Something went wrong.";
}

function errorDetailMessage(e: APIError): string | undefined {
  const body = e.error as { error?: { message?: unknown } } | undefined;
  const msg = body?.error?.message;
  return typeof msg === "string" ? msg : undefined;
}
