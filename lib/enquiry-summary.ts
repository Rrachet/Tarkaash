/** Summary of the enquiry this browser just sent, kept in an httpOnly cookie for the confirmation page. */
export const ENQUIRY_COOKIE = "tk_enquiry";
export const REF_PATTERN = /^TK-\d{4}-[0-9A-F]{6}$/;

export type EnquirySummary = {
  ref: string;
  duplicate: boolean;
  vendor: { name: string; slug: string } | null;
  service: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  locality: string | null;
  assist: boolean;
  at: string;
};

export function readEnquirySummary(raw: string | undefined): EnquirySummary | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as EnquirySummary;
    return typeof v?.ref === "string" && REF_PATTERN.test(v.ref) ? v : null;
  } catch {
    return null;
  }
}
