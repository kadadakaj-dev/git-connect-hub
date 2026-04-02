import { describe, expect, it } from "vitest";

function safeParseCurrency(input: unknown): number {
  if (typeof input === "number") return Number.isFinite(input) ? input : 0;
  if (typeof input === "string") {
    const normalized = input.replace(/[^0-9.,-]/g, "").replace(",", ".");
    const value = Number.parseFloat(normalized);
    return Number.isFinite(value) ? value : 0;
  }
  return 0;
}

function sanitizeUserHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function mergeQueueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Map<string, T>();
  for (const item of items) seen.set(item.id, item);
  return Array.from(seen.values());
}

describe("Special hidden-weakness detection suite", () => {
  it("catches NaN/Infinity poisoning in financial values", () => {
    const samples: unknown[] = [12.4, "13.5", "EUR 99,99", NaN, Infinity, "--", null, undefined];
    const parsed = samples.map(safeParseCurrency);

    expect(parsed.every((n) => Number.isFinite(n))).toBe(true);
    expect(parsed[3]).toBe(0);
    expect(parsed[4]).toBe(0);
  });

  it("catches hidden XSS vectors in mixed payloads", () => {
    const payloads = [
      "<script>alert(1)</script>",
      "<img src=x onerror=alert(1) />",
      "\" onmouseover=alert(1) x=\"",
      "javascript:alert(1)",
      "<svg><animate onbegin=alert(1) />"
    ];

    const sanitized = payloads.map(sanitizeUserHtml).join(" ");
    expect(sanitized).not.toContain("<script");
    expect(sanitized).not.toContain("<");
    expect(sanitized).not.toContain(">");
    expect(sanitized).toContain("&lt;img");
  });

  it("detects replay/duplication weakness in offline queue", () => {
    const queue = [
      { id: "a", op: "create" },
      { id: "b", op: "update" },
      { id: "a", op: "create" }
    ];

    const deduped = mergeQueueById(queue);
    expect(deduped).toHaveLength(2);
  });

  it("reveals unstable sorting collisions for equal timestamps", () => {
    const feed = [
      { id: "1", ts: 1000 },
      { id: "2", ts: 1000 },
      { id: "3", ts: 999 }
    ];

    const sorted = [...feed].sort((a, b) => b.ts - a.ts || a.id.localeCompare(b.id));
    expect(sorted.map((x) => x.id)).toEqual(["1", "2", "3"]);
  });

  it("flags missing i18n keys early via strict lookup", () => {
    const dict = {
      en: { bookingConfirmed: "Booking confirmed" }
    };

    const t = (lang: keyof typeof dict, key: string) => {
      const value = (dict[lang] as Record<string, string>)[key];
      if (!value) throw new Error(`Missing translation: ${lang}.${key}`);
      return value;
    };

    expect(() => t("en", "bookingConfirmed")).not.toThrow();
    expect(() => t("en", "missingKey")).toThrow("Missing translation");
  });

  it("guards against prototype pollution style payloads", () => {
    const payload = JSON.parse('{"safe":1,"__proto__":{"polluted":true}}') as Record<string, unknown>;
    const target = Object.assign({}, payload);

    expect(Object.prototype.hasOwnProperty.call(target, "safe")).toBe(true);
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
  });
});
