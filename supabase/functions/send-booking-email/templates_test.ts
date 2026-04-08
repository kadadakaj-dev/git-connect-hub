// @ts-expect-error: Deno-specific URL import
import { assertEquals, assertStringIncludes, assertNotMatch } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { 
  generateSubject, 
  generateEmailHtml, 
  generateReminderHtml, 
  generateCancellationClientHtml,
  EmailRequest 
} from "./templates.ts";

// Improved type safety for Deno Edge Runtime in IDE
declare const Deno: {
  test(name: string, fn: () => void | Promise<void>): void;
};

const mockBooking: EmailRequest = {
  to: "klient@example.com",
  clientName: "Janko Hraško",
  serviceName: "Chiro masáž (60 min)",
  date: "2026-04-12",
  time: "10:00",
  cancellationToken: "test-token",
  language: "sk",
  template: "confirmation"
};

const mockAdminData = {
  clientName: "Janko Hraško",
  clientEmail: "klient@example.com",
  clientPhone: "+421900111222",
  notes: "Prosím o dôkladnú masáž chrbta."
};

Deno.test("Email Template: Confirmation (Client)", () => {
  const data = { ...mockBooking, template: "confirmation" as const };
  const subject = generateSubject(data);
  const html = generateEmailHtml(data, "https://fyzioafit.sk");

  // Subject assertions
  assertStringIncludes(subject, "✅");
  assertStringIncludes(subject, "Chiro masáž (60 min)");
  assertStringIncludes(subject, "Potvrdenie rezervácie");

  // HTML Visual Assertions
  assertStringIncludes(html, "<h1");
  assertStringIncludes(html, "Chiro masáž (60 min)</h1>");
  assertStringIncludes(html, "FYZIOAFIT Booking System");
  
  // Anti-Regression: Generic fallback must NOT be dominant
  assertNotMatch(html, /<h1[^>]*>Potvrdenie rezervácie<\/h1>/);
});

Deno.test("Email Template: Reminder (Client)", () => {
  const data = { ...mockBooking, template: "reminder" as const };
  const subject = generateSubject(data);
  const html = generateReminderHtml(data, "https://fyzioafit.sk");

  assertStringIncludes(subject, "🔔");
  assertStringIncludes(subject, "Chiro masáž (60 min)");
  assertStringIncludes(html, "Chiro masáž (60 min)</h1>");
  assertStringIncludes(html, "PRIPOMIENKA TERMÍNU");
});

Deno.test("Email Template: Fallback for missing service name", () => {
  const data: EmailRequest = { ...mockBooking, serviceName: "", language: "sk" };
  const subject = generateSubject(data);
  const html = generateEmailHtml(data, "https://fyzioafit.sk");

  // Should use localized fallback "Naša služba" instead of "undefined" or generic "Nová rezervácia"
  assertStringIncludes(subject, "Naša služba");
  assertStringIncludes(html, "Naša služba</h1>");
  assertNotMatch(html, /undefined/);
  assertNotMatch(html, /null/);
});

Deno.test("Email Template: No leaked undefined/null values (Anti-Defacing)", () => {
  const templates: NonNullable<EmailRequest['template']>[] = ["confirmation", "reminder", "cancellation-client"];
  
  for (const template of templates) {
    const data: EmailRequest = { ...mockBooking, template: template };
    const html = generateEmailHtml(data, "https://fyzioafit.sk");
    
    // Critical production check: Never send "undefined" or "null" text to customers
    assertNotMatch(html, /undefined/i, `Leaked 'undefined' in ${template} template`);
    assertNotMatch(html, /null/i, `Leaked 'null' in ${template} template`);
  }
});

Deno.test("Email Template: Admin New Booking", () => {
  const data: EmailRequest = { 
    ...mockBooking, 
    template: "admin-notification" as const,
    adminData: mockAdminData
  };
  const subject = generateSubject(data);
  assertStringIncludes(subject, "📅");
  assertStringIncludes(subject, "NOVÁ");
  assertStringIncludes(subject, "Chiro masáž (60 min)");
});

Deno.test("Email Template: Admin Cancellation", () => {
  const data: EmailRequest = { 
    ...mockBooking, 
    template: "cancellation-admin" as const,
    adminData: mockAdminData
  };
  const subject = generateSubject(data);
  assertStringIncludes(subject, "❌");
  assertStringIncludes(subject, "ZRUŠENÁ");
});

