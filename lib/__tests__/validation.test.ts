import { describe, expect, it } from "vitest";
import { enquirySchema, paymentSchema, ticketSchema, serviceSchema, dateRangeSchema, fieldErrors } from "@/lib/validation";

const base = {
  idempotencyKey: "abcdefgh-1234",
  name: "Priya Sharma",
  phone: "98765 43210",
  request: "Chocolate cake for a birthday party",
  consent: true as const,
};

describe("enquirySchema", () => {
  it("accepts a valid enquiry and normalises the phone", () => {
    const r = enquirySchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.phone).toBe("9876543210");
  });

  it("requires a phone or email", () => {
    const r = enquirySchema.safeParse({ ...base, phone: "" });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).phone).toMatch(/phone number or email/);
  });

  it("rejects a short phone, a short request and missing consent", () => {
    const r = enquirySchema.safeParse({ ...base, phone: "12345", request: "cake", consent: false });
    expect(r.success).toBe(false);
    if (!r.success) {
      const e = fieldErrors(r.error);
      expect(e.phone).toBeDefined();
      expect(e.request).toBeDefined();
      expect(e.consent).toBeDefined();
    }
  });

  it("rejects past dates and bad emails", () => {
    const r = enquirySchema.safeParse({ ...base, preferredDate: "2020-01-01", email: "not-an-email" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const e = fieldErrors(r.error);
      expect(e.preferredDate).toMatch(/past/);
      expect(e.email).toMatch(/valid email/);
    }
  });

  it("rejects non-uuid ids", () => {
    expect(enquirySchema.safeParse({ ...base, serviceId: "1; drop table" }).success).toBe(false);
  });
});

describe("paymentSchema", () => {
  const orderId = "7f1c2a2e-1a2b-4c3d-8e9f-001122334455";
  it("needs a reference for non-cash payments", () => {
    const r = paymentSchema.safeParse({ orderId, amount: 500, method: "upi" });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).reference).toBeDefined();
  });
  it("allows cash without a reference", () => {
    expect(paymentSchema.safeParse({ orderId, amount: "500", method: "cash" }).success).toBe(true);
  });
  it("rejects zero amounts", () => {
    expect(paymentSchema.safeParse({ orderId, amount: 0, method: "cash" }).success).toBe(false);
  });
});

describe("ticketSchema", () => {
  it("validates topic and contact", () => {
    expect(ticketSchema.safeParse({ name: "Ravi", email: "ravi@example.com", topic: "support", message: "I need help with an order", consent: true }).success).toBe(true);
    expect(ticketSchema.safeParse({ name: "Ravi", topic: "other", message: "I need help with an order", consent: true }).success).toBe(false);
  });
});

describe("serviceSchema", () => {
  const vendorId = "7f1c2a2e-1a2b-4c3d-8e9f-001122334455";
  it("requires a price unless quote-based", () => {
    expect(serviceSchema.safeParse({ vendorId, title: "Custom Cakes", priceType: "from" }).success).toBe(false);
    expect(serviceSchema.safeParse({ vendorId, title: "Custom Itinerary", priceType: "quote" }).success).toBe(true);
  });
});

describe("dateRangeSchema", () => {
  it("caps ranges at a year and enforces order", () => {
    expect(dateRangeSchema.safeParse({ from: "2026-01-01", to: "2026-03-01" }).success).toBe(true);
    expect(dateRangeSchema.safeParse({ from: "2026-03-01", to: "2026-01-01" }).success).toBe(false);
    expect(dateRangeSchema.safeParse({ from: "2024-01-01", to: "2026-01-01" }).success).toBe(false);
  });
});
