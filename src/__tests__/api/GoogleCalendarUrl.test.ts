import { describe, it, expect } from 'vitest';
import { generateGoogleCalendarUrl } from '../../../supabase/functions/send-booking-email/templates';
import type { EmailRequest } from '../../../supabase/functions/send-booking-email/templates';

const base: EmailRequest = {
  to: 'jan@priklad.sk',
  clientName: 'Ján Novák',
  serviceName: 'Chiropraxia (60 min)',
  date: '2026-04-08',
  time: '09:00',
  cancellationToken: 'token',
  language: 'sk',
  template: 'confirmation',
};

describe('generateGoogleCalendarUrl — timezone', () => {
  it('letný čas CEST +02:00: 09:00 Bratislava → 07:00 UTC v URL', () => {
    // 2026-04-08 = apríl = CEST = UTC+2
    const url = generateGoogleCalendarUrl(base);
    expect(url).toContain('20260408T070000Z');
    // end = 07:00 + 60 min = 08:00 UTC
    expect(url).toContain('20260408T080000Z');
  });

  it('zimný čas CET +01:00: 09:00 Bratislava → 08:00 UTC v URL', () => {
    // 2026-01-15 = január = CET = UTC+1
    const url = generateGoogleCalendarUrl({ ...base, date: '2026-01-15' });
    expect(url).toContain('20260115T080000Z');
    // end = 08:00 + 60 min = 09:00 UTC
    expect(url).toContain('20260115T090000Z');
  });
});
