export type AppRole = "customer" | "vendor" | "admin" | "finance";

/** Which roles may open a path. `null` = public, `"any"` = any signed-in user. */
export function requiredRoleFor(path: string): AppRole[] | "any" | null {
  if (path === "/admin" || path.startsWith("/admin/")) return ["admin", "finance"];
  if (path === "/vendor" || path.startsWith("/vendor/")) return ["vendor", "admin"];
  if (path === "/account" || path.startsWith("/account/")) return "any";
  if (path.startsWith("/list-your-service/apply")) return "any";
  return null;
}

/** Where a role lands after sign-in. */
export function homeFor(role: AppRole): string {
  switch (role) {
    case "admin":
    case "finance":
      return "/admin";
    case "vendor":
      return "/vendor";
    default:
      return "/account";
  }
}

/** Only allow same-site relative redirects after login. */
export function safeNext(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}
