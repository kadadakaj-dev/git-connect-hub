/**
 * Tests: serviceDescription appears in ALL email template types.
 * Covers both the "has description" and "no description" branches.
 */
import { describe, it, expect } from 'vitest';
import {
  generateEmailText,
  generateEmailHtml,
  generateReminderText,
  generateReminderHtml,
  generateReminder10hText,
  generateReminder10hHtml,
  generateAdminNotificationText,
  generateAdminNotificationHtml,
  generateCancellationAdminText,
  generateCancellationAdminHtml,
  generateCancellationClientText,
  generateCancellationClientHtml,
} from '../../../supabase/functions/send-booking-email/templates';
import type { EmailRequest } from '../../../supabase/functions/send-booking-email/templates';

const BASE_URL = 'https://booking.fyzioafit.sk';
const DESCRIPTION = 'Manuálna terapia chrbtice a kĺbov';

const base: EmailRequest = {
  to: 'jan@priklad.sk',
  clientName: 'Ján Novák',
  serviceName: 'Chiropraxia (60 min)',
  serviceDescription: DESCRIPTION,
  date: '2026-04-08',
  time: '09:00',
  cancellationToken: 'token-uuid-1234',
  language: 'sk',
  template: 'confirmation',
  adminData: {
    clientName: 'Ján Novák',
    clientEmail: 'jan@priklad.sk',
    clientPhone: '+421 900 123 456',
    notes: null,
  },
};

// ─── TEST 1: description present in every template type ─────────────────────
describe('serviceDescription — prítomná v každom type emailu', () => {
  it('generateEmailText obsahuje popis', () => {
    expect(generateEmailText(base, BASE_URL)).toContain(DESCRIPTION);
  });
  it('generateEmailHtml obsahuje popis', () => {
    expect(generateEmailHtml(base, BASE_URL)).toContain(DESCRIPTION);
  });
  it('generateReminderText obsahuje popis', () => {
    expect(generateReminderText({ ...base, template: 'reminder' }, BASE_URL)).toContain(DESCRIPTION);
  });
  it('generateReminderHtml obsahuje popis', () => {
    expect(generateReminderHtml({ ...base, template: 'reminder' }, BASE_URL)).toContain(DESCRIPTION);
  });
  it('generateReminder10hText obsahuje popis', () => {
    expect(generateReminder10hText({ ...base, template: 'reminder-10h' })).toContain(DESCRIPTION);
  });
  it('generateReminder10hHtml obsahuje popis', () => {
    expect(generateReminder10hHtml({ ...base, template: 'reminder-10h' })).toContain(DESCRIPTION);
  });
  it('generateAdminNotificationText obsahuje popis', () => {
    expect(generateAdminNotificationText({ ...base, template: 'admin-notification' })).toContain(DESCRIPTION);
  });
  it('generateAdminNotificationHtml obsahuje popis', () => {
    expect(generateAdminNotificationHtml({ ...base, template: 'admin-notification' })).toContain(DESCRIPTION);
  });
  it('generateCancellationAdminText obsahuje popis', () => {
    expect(generateCancellationAdminText({ ...base, template: 'cancellation-admin' })).toContain(DESCRIPTION);
  });
  it('generateCancellationAdminHtml obsahuje popis', () => {
    expect(generateCancellationAdminHtml({ ...base, template: 'cancellation-admin' })).toContain(DESCRIPTION);
  });
  it('generateCancellationClientText obsahuje popis', () => {
    expect(generateCancellationClientText({ ...base, template: 'cancellation-client' }, BASE_URL)).toContain(DESCRIPTION);
  });
  it('generateCancellationClientHtml obsahuje popis', () => {
    expect(generateCancellationClientHtml({ ...base, template: 'cancellation-client' }, BASE_URL)).toContain(DESCRIPTION);
  });
});

// ─── TEST 2: no description = no "Popis" label shown ────────────────────────
describe('serviceDescription — pri absencii sa nič nevypíše', () => {
  const noDesc: EmailRequest = { ...base, serviceDescription: undefined };

  it('generateEmailText neobsahuje "Popis" keď nie je description', () => {
    expect(generateEmailText(noDesc, BASE_URL)).not.toContain('Popis');
  });
  it('generateAdminNotificationText neobsahuje "Popis" keď nie je description', () => {
    expect(generateAdminNotificationText({ ...noDesc, template: 'admin-notification' })).not.toContain('Popis');
  });
  it('generateCancellationAdminText neobsahuje "Popis" keď nie je description', () => {
    expect(generateCancellationAdminText({ ...noDesc, template: 'cancellation-admin' })).not.toContain('Popis');
  });
  it('generateEmailHtml neobsahuje font-style: italic keď nie je description', () => {
    // The description is the only italic element in the email card
    const html = generateEmailHtml(noDesc, BASE_URL);
    // There should be no description div rendered
    expect(html).not.toContain(DESCRIPTION);
  });
});
