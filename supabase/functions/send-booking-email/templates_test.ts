// @ts-expect-error: Deno-specific URL import
import { assertEquals, assertStringIncludes, assertNotMatch } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import {
  generateSubject,
  generateEmailHtml,
  generateEmailText,
  generateReminderHtml,
  generateReminderText,
  generateReminder10hHtml,
  generateReminder10hText,
  generateCancellationClientHtml,
  generateGoogleCalendarUrl,
  trimHtml,
  EmailRequest
} from "./templates.ts";

// Improved type safety for Deno Edge Runtime in IDE
declare const Deno: {
  test(name: string, fn: () => void | Promise<void>): void;
};

const BASE = "https://booking.fyzioafit.sk";

const mockBooking: EmailRequest = {
  to: "klient@example.com",
  clientName: "Janko Hraško",
  serviceName: "Chiro masáž (60 min)",
  date: "2026-04-12",
  time: "10:00",
  cancellationToken: "abc-123-token",
  language: "sk",
  template: "confirmation",
};

// ─── 1. reminder-24h: subject ─────────────────────────────────────────────────
Deno.test("reminder-24h: subject contains 'zajtra' and FYZIOAFIT", () => {
  const data: EmailRequest = { ...mockBooking, template: "reminder-24h" };
  const subject = generateSubject(data);
  assertStringIncludes(subject, "zajtra");
  assertStringIncludes(subject, "FYZIOAFIT");
});

// ─── 2. reminder-24h: HTML contains cancel button ────────────────────────────
Deno.test("reminder-24h: HTML contains proper cancel button (pill link to /cancel)", () => {
  const data: EmailRequest = { ...mockBooking, template: "reminder-24h" };
  const html = generateReminderHtml(data, BASE);
  // Must have an <a> tag pointing to the cancel URL
  assertStringIncludes(html, "/cancel?token=abc-123-token");
  // Must be a styled button (inline-block, background-color), not a plain underline link
  assertStringIncludes(html, "inline-block");
  assertStringIncludes(html, "border-radius: 99px");
});

// ─── 3. reminder-24h: HTML title uses reminder24hTitle ───────────────────────
Deno.test("reminder-24h: HTML h2 shows correct 24h title", () => {
  const data: EmailRequest = { ...mockBooking, template: "reminder-24h" };
  const html = generateReminderHtml(data, BASE);
  assertStringIncludes(html, "Zajtra máte termín");
});

// ─── 4. reminder-24h: HTML contains service name ─────────────────────────────
Deno.test("reminder-24h: HTML contains service name and date", () => {
  const data: EmailRequest = { ...mockBooking, template: "reminder-24h" };
  const html = generateReminderHtml(data, BASE);
  assertStringIncludes(html, "Chiro masáž (60 min)");
  assertStringIncludes(html, "10:00");
});

// ─── 5. reminder-10h: subject is alarm-style ─────────────────────────────────
Deno.test("reminder-10h: subject contains '10 hodín' and no-cancel message", () => {
  const data: EmailRequest = { ...mockBooking, template: "reminder-10h" };
  const subject = generateSubject(data);
  assertStringIncludes(subject, "10 hod");
  assertStringIncludes(subject, "nie je možné");
});

// ─── 6. reminder-10h: HTML has NO cancel URL ─────────────────────────────────
Deno.test("reminder-10h: HTML does NOT contain cancel link", () => {
  const data: EmailRequest = { ...mockBooking, template: "reminder-10h" };
  const html = generateReminder10hHtml(data);
  assertNotMatch(html, /\/cancel\?token=/);
  assertNotMatch(html, /Zrušiť rezerváciu/);
});

// ─── 7. reminder-10h: HTML contains phone number ─────────────────────────────
Deno.test("reminder-10h: HTML contains phone number +421 905 307 198", () => {
  const data: EmailRequest = { ...mockBooking, template: "reminder-10h" };
  const html = generateReminder10hHtml(data);
  assertStringIncludes(html, "+421 905 307 198");
  assertStringIncludes(html, "tel:");
});

// ─── 8. reminder-10h: HTML contains no-cancel warning ────────────────────────
Deno.test("reminder-10h: HTML clearly states online cancellation is not possible", () => {
  const data: EmailRequest = { ...mockBooking, template: "reminder-10h" };
  const html = generateReminder10hHtml(data);
  assertStringIncludes(html, "Online zrušenie nie je možné");
  assertStringIncludes(html, "10 €");
});

// ─── 9. reminder-10h: plain text has no cancel URL ───────────────────────────
Deno.test("reminder-10h: plain text contains phone but no cancel URL", () => {
  const data: EmailRequest = { ...mockBooking, template: "reminder-10h" };
  const text = generateReminder10hText(data);
  assertStringIncludes(text, "+421 905 307 198");
  assertNotMatch(text, /\/cancel\?token=/);
  assertStringIncludes(text, "Online zrušenie nie je možné");
});

// ─── 10. No undefined/null leaks in any reminder template ─────────────���──────
Deno.test("No undefined/null/NaN leaked in reminder-24h and reminder-10h HTML", () => {
  const templates: NonNullable<EmailRequest["template"]>[] = ["reminder-24h", "reminder-10h"];
  for (const template of templates) {
    const data: EmailRequest = { ...mockBooking, template };
    const html = template === "reminder-10h"
      ? generateReminder10hHtml(data)
      : generateReminderHtml(data, BASE);
    assertNotMatch(html, /undefined/i, `Leaked 'undefined' in ${template}`);
    assertNotMatch(html, /\bnull\b/i, `Leaked 'null' in ${template}`);
    assertNotMatch(html, /\bNaN\b/, `Leaked 'NaN' in ${template}`);
  }
});

// ─── Regression: existing templates still work ───────────────────────────────
Deno.test("Regression: confirmation subject and HTML correct", () => {
  const data: EmailRequest = { ...mockBooking, template: "confirmation" };
  const subject = generateSubject(data);
  assertStringIncludes(subject, "Potvrdenie");
  assertStringIncludes(subject, "FYZIOAFIT");
  const html = generateEmailHtml(data, BASE);
  assertStringIncludes(html, "Chiro masáž (60 min)");
  assertNotMatch(html, /undefined/i);
});

Deno.test("Regression: reminder (short) still generates cancel link", () => {
  const data: EmailRequest = { ...mockBooking, template: "reminder" };
  const html = generateReminderHtml(data, BASE);
  assertStringIncludes(html, "/cancel?token=abc-123-token");
  assertStringIncludes(html, "Chiro masáž (60 min)");
});

Deno.test("trimHtml: no trailing spaces or blank lines (=20 prevention)", () => {
  const raw = generateEmailHtml(mockBooking, BASE);
  const trimmed = trimHtml(raw);
  const linesWithTrailingSpace = trimmed.split("\n").filter(l => l !== l.trimEnd());
  assertEquals(linesWithTrailingSpace.length, 0, `Lines with trailing spaces: ${linesWithTrailingSpace.length}`);
  const blankLines = trimmed.split("\n").filter(l => l.trim() === "");
  assertEquals(blankLines.length, 0, `Blank lines remaining: ${blankLines.length}`);
  assertStringIncludes(trimmed, "Chiro masáž (60 min)");
  // Check for QP-encoded space specifically: =20 followed by whitespace or end-of-line
  // (not =2026 in Google Calendar dates)
  assertNotMatch(trimmed, /=20[\s\n]/);
});

// ─── &amp; escaping tests ─────────────────────────────────────────────────────
Deno.test("&amp;: service name with & is escaped in confirmation HTML", () => {
  const data: EmailRequest = { ...mockBooking, serviceName: "Physio & Chiro (60 min)" };
  const html = generateEmailHtml(data, BASE);
  assertStringIncludes(html, "Physio &amp; Chiro (60 min)");
  assertNotMatch(html, /Physio & Chiro/);
});

Deno.test("&amp;: service name with & is NOT escaped in plain text", () => {
  const data: EmailRequest = { ...mockBooking, serviceName: "Physio & Chiro (60 min)" };
  const text = generateEmailText(data, BASE);
  assertStringIncludes(text, "Physio & Chiro (60 min)");
  assertNotMatch(text, /&amp;/);
});

Deno.test("&amp;: Google Calendar URL in HTML href uses &amp; not bare &", () => {
  const html = generateEmailHtml(mockBooking, BASE);
  // The calendar link must encode & as &amp; inside href attribute
  assertStringIncludes(html, "google.com/calendar/render?action=TEMPLATE&amp;text=");
  // No bare & should appear inside the href (only &amp;)
  assertNotMatch(html, /href="https:\/\/www\.google\.com\/calendar\/render[^"]*[^p]&[^a]/);
});

Deno.test("&amp;: generateGoogleCalendarUrl returns bare & (for plain text / external use)", () => {
  const url = generateGoogleCalendarUrl(mockBooking);
  assertStringIncludes(url, "action=TEMPLATE&text=");
  assertNotMatch(url, /&amp;/);
});

Deno.test("&amp;: reminder HTML service name with & is escaped", () => {
  const data: EmailRequest = { ...mockBooking, template: "reminder-24h", serviceName: "Physio & Masáž" };
  const html = generateReminderHtml(data, BASE);
  assertStringIncludes(html, "Physio &amp; Masáž");
  assertNotMatch(html, /Physio & Masáž/);
});

Deno.test("&amp;: reminder-10h HTML service name with & is escaped", () => {
  const data: EmailRequest = { ...mockBooking, template: "reminder-10h", serviceName: "Physio & Masáž" };
  const html = generateReminder10hHtml(data);
  assertStringIncludes(html, "Physio &amp; Masáž");
  assertNotMatch(html, /Physio & Masáž/);
});
