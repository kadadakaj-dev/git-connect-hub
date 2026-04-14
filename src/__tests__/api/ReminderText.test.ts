import { describe, it, expect } from 'vitest';
import {
  generateReminderText,
} from '../../../supabase/functions/send-booking-email/templates';
import type { EmailRequest } from '../../../supabase/functions/send-booking-email/templates';

const base: EmailRequest = {
  to: 'jan@priklad.sk',
  clientName: 'Ján Novák',
  serviceName: 'Chiropraxia',
  date: '2026-04-08',
  time: '09:00',
  cancellationToken: 'token-uuid-1234',
  language: 'sk',
  template: 'reminder',
};

const BASE_URL = 'https://booking.fyzioafit.sk';

describe('generateReminderText', () => {
  it('obsahuje cancelUrl s tokenom (bug: predtým chýbal odkaz)', () => {
    const text = generateReminderText(base, BASE_URL);
    expect(text).toContain(`${BASE_URL}/cancel?token=token-uuid-1234`);
  });

  it('obsahuje cancelUrl aj pre 24h reminder', () => {
    const text = generateReminderText({ ...base, template: 'reminder-24h' }, BASE_URL);
    expect(text).toContain(`${BASE_URL}/cancel?token=token-uuid-1234`);
  });
});
