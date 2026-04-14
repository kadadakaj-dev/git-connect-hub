/**
 * Cancellation email template tests
 * Covers generateCancellationAdminText and generateCancellationClientText
 * after the bug-fix (missing date/time/phone + hardcoded SK language).
 */
import { describe, it, expect } from 'vitest';
import {
  generateCancellationAdminText,
  generateCancellationClientText,
  generateCancellationAdminHtml,
  generateCancellationClientHtml,
} from '../../../supabase/functions/send-booking-email/templates';
import type { EmailRequest } from '../../../supabase/functions/send-booking-email/templates';

const baseData: EmailRequest = {
  to: 'jan@priklad.sk',
  clientName: 'Ján Novák',
  serviceName: 'Chiropraxia & Fyzioterapia',
  date: '2026-04-08',
  time: '09:00',
  cancellationToken: 'abc-token',
  language: 'sk',
  template: 'cancellation-admin',
  adminData: {
    clientName: 'Ján Novák',
    clientEmail: 'jan@priklad.sk',
    clientPhone: '+421 900 123 456',
    notes: null,
  },
};

// ─── TEST 1 ────────────────────────────────────────────────────────────────────
describe('generateCancellationAdminText', () => {
  it('obsahuje dátum, čas, email a telefón klienta', () => {
    const text = generateCancellationAdminText(baseData);

    expect(text).toContain('09:00');
    expect(text).toContain('jan@priklad.sk');
    expect(text).toContain('+421 900 123 456');
    // Dátum musí byť naformátovaný (nie "Invalid Date")
    expect(text).not.toContain('Invalid Date');
    expect(text).toContain('Ján Novák');
  });

  // ─── TEST 2 ──────────────────────────────────────────────────────────────────
  it('neobsahuje HTML entity v plain-texte (escapeHtml bug)', () => {
    const dataWithAmpersand: EmailRequest = {
      ...baseData,
      serviceName: 'Chiropraxia & Fyzioterapia',
    };
    const text = generateCancellationAdminText(dataWithAmpersand);

    // Plain text nesmie obsahovať &amp; — má byť surový znak &
    expect(text).not.toContain('&amp;');
    expect(text).toContain('Chiropraxia & Fyzioterapia');
  });
});

// ─── TEST 3 ────────────────────────────────────────────────────────────────────
describe('generateCancellationClientText', () => {
  it('obsahuje dátum a čas zrušeného termínu (SK)', () => {
    const text = generateCancellationClientText({ ...baseData, language: 'sk', template: 'cancellation-client' }, 'https://booking.fyzioafit.sk');

    expect(text).toContain('09:00');
    expect(text).not.toContain('Invalid Date');
    // Musí obsahovať službu aj sekciu s dátumom
    expect(text).toContain('Chiropraxia');
  });

  // ─── TEST 4 ──────────────────────────────────────────────────────────────────
  it('používa angličtinu pre EN klientov (nie hardcoded SK)', () => {
    const text = generateCancellationClientText(
      { ...baseData, language: 'en', template: 'cancellation-client' },
      'https://booking.fyzioafit.sk'
    );

    // Tieto SK vety nesmú byť v EN emaili
    expect(text).not.toContain('Vaša rezervácia na');
    expect(text).not.toContain('Novú rezerváciu si môžete vytvoriť');
    // Správne EN vety musia byť
    expect(text).toContain('Your booking for');
    expect(text).toContain('You can make a new booking here');
  });

  // ─── TEST 5 ──────────────────────────────────────────────────────────────────
  it('HTML verzia storno klienta obsahuje dátum aj čas (kontrola konzistencie s textom)', () => {
    const html = generateCancellationClientHtml(
      { ...baseData, language: 'sk', template: 'cancellation-client' },
      'https://booking.fyzioafit.sk'
    );
    const text = generateCancellationClientText(
      { ...baseData, language: 'sk', template: 'cancellation-client' },
      'https://booking.fyzioafit.sk'
    );

    // Obe verzie musia obsahovať dátum — HTML ho má vždy mal, text ho nemal (bug)
    expect(html).toContain('09:00');
    expect(text).toContain('09:00');
    // HTML verzia má prečiarknutie cez text-decoration: line-through
    expect(html).toContain('line-through');
  });
});
