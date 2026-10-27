import { z } from "zod";

const phoneRe = /^\+?[0-9]{10,13}$/;
const cleanPhone = (v: string) => v.replace(/[^0-9+]/g, "");

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((v) => (v ? v : undefined));

const phone = z
  .string()
  .optional()
  .transform((v) => (v ? cleanPhone(v) : undefined))
  .refine((v) => !v || phoneRe.test(v), "Please enter a valid 10-digit phone number.");

const email = z
  .string()
  .trim()
  .toLowerCase()
  .optional()
  .transform((v) => (v ? v : undefined))
  .refine((v) => !v || z.email().safeParse(v).success, "Please enter a valid email address.");

const uuid = z.uuid();
const optionalUuid = z.string().optional().transform((v) => (v ? v : undefined)).pipe(uuid.optional());

function todayIST(): string {
  return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}

export const enquirySchema = z
  .object({
    idempotencyKey: z.string().min(8).max(100),
    name: z.string().trim().min(2, "Please enter your name.").max(120),
    email,
    phone,
    request: z.string().trim().min(10, "Please describe what you need in at least 10 characters.").max(2000, "Please keep your request under 2000 characters."),
    vendorId: optionalUuid,
    serviceId: optionalUuid,
    categoryId: optionalUuid,
    preferredDate: z
      .string()
      .optional()
      .transform((v) => (v ? v : undefined))
      .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), "Choose a valid date.")
      .refine((v) => !v || v >= todayIST(), "Preferred date cannot be in the past."),
    preferredTime: optionalText(40),
    locality: optionalText(80),
    details: z.record(z.string(), z.union([z.string().max(200), z.number(), z.boolean()])).default({}),
    assistOptIn: z.boolean().default(false),
    consent: z.literal(true, "Please agree to be contacted about this enquiry."),
    source: z.enum(["web", "mobile_web", "whatsapp_qr"]).default("web"),
    sessionId: optionalText(64),
  })
  .refine((v) => v.email || v.phone, { message: "Please add a phone number or email so Tarkkash can reach you.", path: ["phone"] });
export type EnquiryInput = z.input<typeof enquirySchema>;

export const ticketSchema = z
  .object({
    name: z.string().trim().min(2, "Please enter your name.").max(120),
    email,
    phone,
    topic: z.enum(["listing", "support", "feature", "partnership", "general"], "Choose a topic."),
    message: z.string().trim().min(10, "Please write a message of at least 10 characters.").max(3000),
    consent: z.literal(true, "Please agree to the privacy notice."),
  })
  .refine((v) => v.email || v.phone, { message: "Please add an email or phone number.", path: ["email"] });
export type TicketInput = z.input<typeof ticketSchema>;

export const vendorApplicationSchema = z.object({
  businessName: z.string().trim().min(3, "Please enter your business name.").max(120),
  categoryId: uuid,
  locality: z.string().trim().min(2, "Please enter your locality.").max(80),
  city: z.string().trim().max(60).default("Hyderabad"),
  tagline: optionalText(120),
  description: optionalText(2000),
  serviceArea: optionalText(300),
  phone,
});
export type VendorApplicationInput = z.input<typeof vendorApplicationSchema>;

export const orderStatuses = [
  "new", "accepted", "declined", "in_progress", "completed", "payment_recorded", "submitted", "closed", "cancelled",
] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export const transitionSchema = z.object({
  orderId: uuid,
  to: z.enum(orderStatuses),
  note: optionalText(500),
});

export const orderUpdateSchema = z.object({
  orderId: uuid,
  agreedAmount: z.coerce.number().min(0, "Price cannot be negative.").max(10_000_000).optional(),
  scheduledFor: z.string().optional().transform((v) => (v ? v : undefined)),
  scope: optionalText(2000),
  notes: optionalText(2000),
});

export const paymentSchema = z
  .object({
    orderId: uuid,
    amount: z.coerce.number().positive("Enter the amount received.").max(10_000_000),
    method: z.enum(["cash", "upi", "bank_transfer", "card", "other"], "Choose a payment method."),
    reference: optionalText(100),
    evidenceUrl: z.string().optional().transform((v) => (v ? v : undefined)).pipe(z.url().optional()),
  })
  .refine((v) => v.method === "cash" || v.reference, {
    message: "Add the transaction reference for non-cash payments.",
    path: ["reference"],
  });

export const serviceSchema = z.object({
  id: optionalUuid,
  vendorId: uuid,
  title: z.string().trim().min(3, "Add a service title.").max(120),
  description: optionalText(1000),
  priceType: z.enum(["fixed", "from", "per_unit", "quote"]),
  priceAmount: z.coerce.number().min(0).max(10_000_000).optional(),
  priceUnit: optionalText(40),
  leadTime: optionalText(60),
  deliveryOptions: z.array(z.enum(["delivery", "pickup", "at_home", "online"])).default([]),
  availability: optionalText(200),
  imageUrl: z.string().optional().transform((v) => (v ? v : undefined)).pipe(z.url().optional()),
  active: z.boolean().default(true),
}).refine((v) => v.priceType === "quote" || v.priceAmount !== undefined, {
  message: "Add an indicative price, or choose 'Request a quote'.",
  path: ["priceAmount"],
});
export type ServiceInput = z.input<typeof serviceSchema>;

export const vendorProfileSchema = z.object({
  vendorId: uuid,
  name: z.string().trim().min(3).max(120),
  tagline: optionalText(120),
  description: optionalText(2000),
  locality: z.string().trim().min(2).max(80),
  serviceArea: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  languages: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
  highlights: z.array(z.string().trim().min(1).max(60)).max(8).default([]),
  keyTerms: optionalText(1000),
  yearsExperience: z.coerce.number().int().min(0).max(80).optional(),
  avatarUrl: z.string().optional().transform((v) => (v ? v : undefined)).pipe(z.url().optional()),
  coverUrl: z.string().optional().transform((v) => (v ? v : undefined)).pipe(z.url().optional()),
});

export const reviewSchema = z.object({
  orderId: uuid,
  rating: z.coerce.number().int().min(1, "Choose a rating from 1 to 5.").max(5),
  body: optionalText(1000),
});

export const dateRangeSchema = z
  .object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .refine((v) => v.from <= v.to, "Start date must be before end date.")
  .refine((v) => (Date.parse(v.to) - Date.parse(v.from)) / 86400000 <= 366, "Choose a range of up to one year.");

/** Collapse zod issues into { field: firstMessage }. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
