import type { MetadataRoute } from "next";
import { abs, indexingAllowed } from "@/lib/seo";

const PRIVATE = ["/admin", "/vendor", "/account", "/api/", "/auth/", "/login", "/signup", "/reset-password"];
// AI answer engines are welcome: being cited by them is the point of GEO.
const AI_BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "PerplexityBot", "Google-Extended", "Applebot-Extended", "Bingbot"];

export default function robots(): MetadataRoute.Robots {
  if (!indexingAllowed()) {
    // Demo mode: keep sample vendors and reviews out of search results.
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: AI_BOTS, allow: ["/", "/llms.txt"], disallow: PRIVATE },
    ],
    sitemap: abs("/sitemap.xml"),
    host: abs("/"),
  };
}
