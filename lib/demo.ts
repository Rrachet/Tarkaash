/** Demo accounts available for one-click sign-in. Passwords never leave the server. */
export const DEMO_ACCOUNTS = {
  admin: "tarkaash.admin@example.com",
  finance: "tarkaash.finance@example.com",
  meera: "meera.baking@example.com",
  rohan: "rohan.kitchen@example.com",
  priya: "priya.customer@example.com",
} as const;
export type DemoKey = keyof typeof DEMO_ACCOUNTS;
export const isDemoKey = (k: string): k is DemoKey => Object.hasOwn(DEMO_ACCOUNTS, k);
