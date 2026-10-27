export type Tone = "neutral" | "teal" | "gold" | "mint" | "danger" | "slate";

export const ORDER_STATUS: Record<string, { label: string; tone: Tone }> = {
  new: { label: "Awaiting response", tone: "gold" },
  accepted: { label: "Accepted", tone: "teal" },
  declined: { label: "Declined", tone: "danger" },
  in_progress: { label: "In progress", tone: "teal" },
  completed: { label: "Service delivered", tone: "mint" },
  payment_recorded: { label: "Payment recorded", tone: "mint" },
  submitted: { label: "Submitted to Tarkkash", tone: "gold" },
  closed: { label: "Closed", tone: "slate" },
  cancelled: { label: "Cancelled", tone: "danger" },
};

export const ENQUIRY_STATUS: Record<string, { label: string; tone: Tone }> = {
  new: { label: "With Tarkkash", tone: "gold" },
  assigned: { label: "Sent to provider", tone: "teal" },
  in_fulfilment: { label: "In progress", tone: "teal" },
  closed: { label: "Completed", tone: "mint" },
  cancelled: { label: "Cancelled", tone: "danger" },
  spam: { label: "Spam", tone: "slate" },
};

export const TICKET_STATUS: Record<string, { label: string; tone: Tone }> = {
  open: { label: "Open", tone: "gold" },
  in_progress: { label: "In progress", tone: "teal" },
  resolved: { label: "Resolved", tone: "mint" },
  closed: { label: "Closed", tone: "slate" },
};

export const VENDOR_STATUS: Record<string, { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "slate" },
  pending: { label: "Pending review", tone: "gold" },
  active: { label: "Live", tone: "mint" },
  paused: { label: "Paused", tone: "slate" },
  rejected: { label: "Rejected", tone: "danger" },
  removed: { label: "Removed", tone: "danger" },
};

export const MODERATION_STATUS: Record<string, { label: string; tone: Tone }> = {
  pending: { label: "Waiting for approval", tone: "gold" },
  approved: { label: "Approved", tone: "mint" },
  rejected: { label: "Not approved", tone: "danger" },
};

/** Lifecycle shown in the stepper (declined/cancelled are off-path). */
export const ORDER_STEPS = ["new", "accepted", "in_progress", "completed", "payment_recorded", "submitted", "closed"] as const;

export const ORDER_STEP_LABELS: Record<string, string> = {
  new: "Enquiry received",
  accepted: "Accepted",
  in_progress: "In progress",
  completed: "Delivered",
  payment_recorded: "Payment recorded",
  submitted: "Submitted",
  closed: "Closed",
};

/** Vendor-facing next actions for each status (database enforces the same rules). */
export const VENDOR_ACTIONS: Record<string, { to: string; label: string; variant: "primary" | "gold" | "danger" | "ghost"; needsNote?: boolean }[]> = {
  new: [
    { to: "accepted", label: "Accept enquiry", variant: "primary" },
    { to: "declined", label: "Decline", variant: "ghost", needsNote: true },
  ],
  accepted: [
    { to: "in_progress", label: "Start work", variant: "primary" },
    { to: "cancelled", label: "Cancel order", variant: "ghost", needsNote: true },
  ],
  in_progress: [
    { to: "completed", label: "Mark service delivered", variant: "primary" },
    { to: "cancelled", label: "Cancel order", variant: "ghost", needsNote: true },
  ],
  payment_recorded: [{ to: "submitted", label: "Submit to Tarkkash", variant: "gold" }],
};

export const ADMIN_ACTIONS: Record<string, { to: string; label: string; variant: "primary" | "gold" | "danger" | "ghost"; needsNote?: boolean }[]> = {
  submitted: [
    { to: "closed", label: "Verify & close order", variant: "primary" },
    { to: "payment_recorded", label: "Return to vendor", variant: "ghost", needsNote: true },
  ],
  accepted: [{ to: "cancelled", label: "Cancel order", variant: "ghost", needsNote: true }],
  in_progress: [{ to: "cancelled", label: "Cancel order", variant: "ghost", needsNote: true }],
};
