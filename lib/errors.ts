export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

type PgLikeError = { code?: string; message?: string } | null | undefined;

/**
 * Turn a Postgres/PostgREST error into a message safe to show users.
 * Database functions raise friendly messages with code 22023 (validation), P0001 (business rule)
 * or P0429 (rate limit); those pass through. Anything else becomes a generic message.
 */
export function friendlyError(err: PgLikeError): string {
  if (!err) return "Something went wrong. Please try again.";
  const code = err.code ?? "";
  const message = (err.message ?? "").trim();
  if (code === "42501") {
    if (/^not authori[sz]ed$/i.test(message) || /row-level security/i.test(message))
      return "You do not have permission to do that. Demo staff accounts are view only.";
    if (!message || /permission denied/i.test(message)) return "You do not have access to do that.";
    return message;
  }
  if (code === "P0429") return message || "Too many requests. Please try again later.";
  if (code === "22023" || code === "P0001") return message || "Please check the details and try again.";
  if (code === "23505") return "This has already been submitted.";
  if (code === "PGRST301" || /JWT/i.test(message)) return "Your session has expired. Please sign in again.";
  return "Something went wrong. Please try again.";
}

export function fail(error: string, fieldErrors?: Record<string, string>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}
