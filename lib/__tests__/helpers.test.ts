import { describe, expect, it } from "vitest";
import { friendlyError } from "@/lib/errors";
import { toCsv } from "@/lib/csv";
import { resolveRange, addDays } from "@/lib/dates";
import { requiredRoleFor, homeFor, safeNext } from "@/lib/routes";

describe("friendlyError", () => {
  it("passes through validation and business-rule messages", () => {
    expect(friendlyError({ code: "22023", message: "Please enter your name." })).toBe("Please enter your name.");
    expect(friendlyError({ code: "P0001", message: "Record a payment first." })).toBe("Record a payment first.");
    expect(friendlyError({ code: "P0429", message: "Too many enquiries." })).toBe("Too many enquiries.");
  });
  it("hides internal errors", () => {
    expect(friendlyError({ code: "42P01", message: 'relation "x" does not exist' })).toBe("Something went wrong. Please try again.");
    expect(friendlyError({ code: "42501", message: "permission denied for function admin_metrics" })).toBe("You do not have access to do that.");
  });
});

describe("toCsv", () => {
  it("quotes commas, quotes and newlines", () => {
    expect(toCsv(["a", "b"], [["x,y", 'say "hi"']])).toBe('a,b\r\n"x,y","say ""hi"""\r\n');
  });
  it("neutralises spreadsheet formulas but keeps negative numbers", () => {
    expect(toCsv(["a"], [["=HYPERLINK(1)"]])).toBe("a\r\n'=HYPERLINK(1)\r\n");
    expect(toCsv(["a"], [[-25]])).toBe("a\r\n-25\r\n");
  });
});

describe("resolveRange", () => {
  const now = new Date("2026-10-24T10:00:00Z");
  it("defaults to the last 30 days in IST", () => {
    expect(resolveRange({}, now)).toMatchObject({ from: "2026-09-25", to: "2026-10-24" });
  });
  it("accepts presets and explicit ranges, rejects bad ones", () => {
    expect(resolveRange({ range: "7d" }, now).from).toBe("2026-10-18");
    expect(resolveRange({ from: "2026-10-01", to: "2026-10-10" }, now)).toMatchObject({ from: "2026-10-01", to: "2026-10-10" });
    expect(resolveRange({ from: "2026-10-10", to: "2026-10-01" }, now).label).toBe("Last 30 days");
  });
  it("adds days across month ends", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
  });
});

describe("routes", () => {
  it("guards portals by role", () => {
    expect(requiredRoleFor("/admin/enquiries")).toEqual(["admin", "finance"]);
    expect(requiredRoleFor("/vendor")).toEqual(["vendor", "admin"]);
    expect(requiredRoleFor("/account")).toBe("any");
    expect(requiredRoleFor("/vendors/meeras-home-baking")).toBeNull();
    expect(homeFor("finance")).toBe("/admin");
  });
  it("only allows relative redirects", () => {
    expect(safeNext("/vendor/orders")).toBe("/vendor/orders");
    expect(safeNext("//evil.com")).toBe("/");
    expect(safeNext("https://evil.com")).toBe("/");
    expect(safeNext("/\\evil.com")).toBe("/");
  });
});
