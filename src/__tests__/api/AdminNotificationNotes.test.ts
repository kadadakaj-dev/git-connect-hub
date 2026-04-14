import { describe, it, expect } from 'vitest';
import {
  generateAdminNotificationText,
  generateAdminNotificationHtml,
} from '../../../supabase/functions/send-booking-email/templates';
import type { EmailRequest } from '../../../supabase/functions/send-booking-email/templates';

const base: EmailRequest = {
  to: 'booking@fyzioafit.sk',
  clientName: 'Ján Novák',
  serviceName: 'Chiropraxia',
  date: '2026-04-08',
  time: '09:00',
  cancellationToken: '',
  language: 'sk',
  template: 'admin-notification',
  adminData: {
    clientName: 'Ján Novák',
    clientEmail: 'jan@priklad.sk',
    clientPhone: '+421 900 123 456',
    notes: 'Bolesti chrbta, prídem auto',
  },
};

describe('Admin notification — poznámka klienta', () => {
  it('text verzia zobrazuje poznámku klienta', () => {
    const text = generateAdminNotificationText(base);
    expect(text).toContain('Bolesti chrbta, prídem auto');
  });

  it('HTML verzia zobrazuje poznámku klienta, pri null ju vynechá', () => {
    const htmlWithNotes = generateAdminNotificationHtml(base);
    expect(htmlWithNotes).toContain('Bolesti chrbta, prídem auto');
    expect(htmlWithNotes).toContain('Poznámka klienta');

    const htmlNoNotes = generateAdminNotificationHtml({
      ...base,
      adminData: { ...base.adminData!, notes: null },
    });
    expect(htmlNoNotes).not.toContain('Poznámka klienta');
  });
});
