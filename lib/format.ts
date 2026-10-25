const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const inrCompact = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });
const num = new Intl.NumberFormat("en-IN");

export function formatINR(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  return inr.format(Number(value));
}

export function formatINRCompact(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `₹${inrCompact.format(value)}`;
}

export function formatNumber(value: number | null | undefined): string {
  return value === null || value === undefined ? "—" : num.format(value);
}

export function formatPercent(value: number | null | undefined, digits = 0): string {
  return value === null || value === undefined ? "—" : `${(value * 100).toFixed(digits)}%`;
}

export function formatDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return "—";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  if (minutes < 60 * 48) return `${(minutes / 60).toFixed(1)} h`;
  return `${(minutes / 1440).toFixed(1)} days`;
}

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
const dateTimeFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
const shortDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

export function formatDate(value: string | null | undefined): string {
  return value ? dateFmt.format(new Date(value)) : "—";
}
export function formatDateTime(value: string | null | undefined): string {
  return value ? dateTimeFmt.format(new Date(value)) : "—";
}
export function formatShortDate(value: string | null | undefined): string {
  return value ? shortDate.format(new Date(value)) : "—";
}

export function timeAgo(value: string | null | undefined, now = Date.now()): string {
  if (!value) return "—";
  const s = Math.round((now - new Date(value).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} d ago`;
  return formatDate(value);
}

export type PriceLike = { price_type: string; price_amount: number | null; price_unit: string | null };

/** "From ₹800 per kg", "₹250 per pack", "Request a quote". */
export function priceLabel(s: PriceLike): string {
  if (s.price_type === "quote" || s.price_amount === null) return "Request a quote";
  const amount = formatINR(s.price_amount);
  const unit = s.price_unit ? ` ${s.price_unit}` : "";
  if (s.price_type === "from") return `From ${amount}${unit}`;
  return `${amount}${unit}`;
}

export const DELIVERY_LABELS: Record<string, string> = {
  delivery: "Home delivery",
  pickup: "Pickup",
  at_home: "At your home",
  online: "Online",
};

export function initials(name: string | null | undefined): string {
  if (!name) return "T";
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join("");
}

/** Resize an Unsplash or Supabase image URL. Other URLs pass through. */
export function sizedImage(url: string | null | undefined, width: number, height?: number): string | null {
  if (!url) return null;
  if (url.includes("images.unsplash.com")) {
    const u = new URL(url);
    u.searchParams.set("w", String(width));
    if (height) u.searchParams.set("h", String(height));
    else u.searchParams.delete("h");
    u.searchParams.set("fit", "crop");
    u.searchParams.set("auto", "format");
    u.searchParams.set("q", "75");
    return u.toString();
  }
  return url;
}

/** Scheduled time; date-only values (stored as UTC midnight) are shown without a time. */
export function formatSchedule(value: string | null | undefined): string {
  if (!value) return "To be confirmed";
  const d = new Date(value);
  return d.getUTCHours() === 0 && d.getUTCMinutes() === 0 ? formatDate(value) : formatDateTime(value);
}
