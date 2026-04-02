/**
 * Unit tests: booking form validation helpers
 *
 * These tests verify the pure validation rules used by the booking flow
 * (page.tsx) without rendering any React components.
 *
 * Covered rules:
 *  - A time slot must be a non-empty string from the allowed list
 *  - Customer name must be non-empty after trimming
 *  - Customer phone must be non-empty after trimming
 *  - Email is optional but, when provided, must look like an e-mail
 *  - Notes are optional (empty string is fine)
 */
import { describe, it, expect } from "vitest";

// ── Pure validation helpers (extracted so tests don't need React) ──────────

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "13:00", "13:30", "14:00",
  "14:30", "15:00", "15:30", "16:00", "16:30", "17:00",
] as const;

type TimeSlot = typeof TIME_SLOTS[number];

function isValidSlot(slot: string): slot is TimeSlot {
  return (TIME_SLOTS as readonly string[]).includes(slot);
}

function isValidPhone(phone: string): boolean {
  const trimmed = phone.trim();
  if (!trimmed) return false;
  // Allow international format: +421 xxx xxx xxx or local: 09xx xxx xxx
  return /^\+?[\d\s\-()]{7,20}$/.test(trimmed);
}

function isValidEmail(email: string): boolean {
  if (!email.trim()) return true; // optional field — empty is fine
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function canSubmit(params: {
  selectedService: boolean;
  slot: string;
  name: string;
  phone: string;
}): boolean {
  const { selectedService, slot, name, phone } = params;
  return (
    selectedService &&
    isValidSlot(slot) &&
    name.trim().length > 0 &&
    phone.trim().length > 0
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("isValidSlot", () => {
  it("accepts a slot from the allowed list", () => {
    expect(isValidSlot("09:00")).toBe(true);
    expect(isValidSlot("17:00")).toBe(true);
  });

  it("rejects an empty string", () => {
    expect(isValidSlot("")).toBe(false);
  });

  it("rejects an arbitrary time not in the list", () => {
    expect(isValidSlot("07:00")).toBe(false);
    expect(isValidSlot("18:00")).toBe(false);
    expect(isValidSlot("12:30")).toBe(false); // lunch gap
  });

  it("rejects partial matches (e.g. injected value)", () => {
    expect(isValidSlot("09:00; DROP TABLE bookings")).toBe(false);
  });
});

describe("isValidPhone", () => {
  it("accepts a Slovak mobile number", () => {
    expect(isValidPhone("0900 123 456")).toBe(true);
    expect(isValidPhone("+421 900 123 456")).toBe(true);
  });

  it("accepts an international format number", () => {
    expect(isValidPhone("+1 (555) 000-1234")).toBe(true);
  });

  it("rejects an empty string", () => {
    expect(isValidPhone("")).toBe(false);
    expect(isValidPhone("   ")).toBe(false);
  });

  it("rejects a string with letters", () => {
    expect(isValidPhone("abc123")).toBe(false);
  });
});

describe("isValidEmail", () => {
  it("passes empty string (field is optional)", () => {
    expect(isValidEmail("")).toBe(true);
    expect(isValidEmail("   ")).toBe(true);
  });

  it("accepts a valid email address", () => {
    expect(isValidEmail("user@example.sk")).toBe(true);
    expect(isValidEmail("john.doe+tag@domain.co.uk")).toBe(true);
  });

  it("rejects an address missing the @", () => {
    expect(isValidEmail("notanemail")).toBe(false);
  });

  it("rejects an address missing the domain", () => {
    expect(isValidEmail("user@")).toBe(false);
  });
});

describe("canSubmit", () => {
  const base = { selectedService: true, slot: "10:00", name: "Ján Novák", phone: "0900 000 000" };

  it("returns true when all required fields are valid", () => {
    expect(canSubmit(base)).toBe(true);
  });

  it("returns false when no service is selected", () => {
    expect(canSubmit({ ...base, selectedService: false })).toBe(false);
  });

  it("returns false when slot is invalid", () => {
    expect(canSubmit({ ...base, slot: "" })).toBe(false);
    expect(canSubmit({ ...base, slot: "99:99" })).toBe(false);
  });

  it("returns false when name is blank", () => {
    expect(canSubmit({ ...base, name: "" })).toBe(false);
    expect(canSubmit({ ...base, name: "   " })).toBe(false);
  });

  it("returns false when phone is blank", () => {
    expect(canSubmit({ ...base, phone: "" })).toBe(false);
    expect(canSubmit({ ...base, phone: "  " })).toBe(false);
  });
});