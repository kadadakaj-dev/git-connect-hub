import { format } from 'date-fns';
import { CalendarEvent } from './types';
import { getEndTime, getEventColorByCategory } from './utils';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, Clock, User } from 'lucide-react';
import type { Language } from '@/i18n/translations';

interface ListViewProps {
  language: Language;
  events: CalendarEvent[];
  selectedTherapist: string;
  onEditEvent: (event: CalendarEvent) => void;
}

const ListView = ({ language, events, selectedTherapist, onEditEvent }: ListViewProps) => {
  let filtered = [...events];
  if (selectedTherapist !== 'all') {
    filtered = filtered.filter(e => e.therapistId === selectedTherapist);
  }
  filtered.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.startTime.localeCompare(b.startTime);
  });

  const t = {
    noBookings: language === 'sk' ? 'Žiadne rezervácie v tomto období' : 'No bookings in this period',
    time: language === 'sk' ? 'Čas' : 'Time',
    service: language === 'sk' ? 'Služba' : 'Service',
    client: language === 'sk' ? 'Klient' : 'Client',
    employee: language === 'sk' ? 'Zamestnanec' : 'Employee',
    status: language === 'sk' ? 'Stav' : 'Status',
    confirmed: language === 'sk' ? 'Potvrdené' : 'Confirmed',
    pending: language === 'sk' ? 'Čakajúce' : 'Pending',
    block: language === 'sk' ? 'Blokácia' : 'Block',
  };

  const getStatusLabel = (status: string, type: string) => {
    if (type === 'block') return t.block;
    if (status === 'pending') return t.pending;
    return t.confirmed;
  };

  const getStatusVariant = (status: string, type: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (type === 'block') return 'secondary';
    if (status === 'pending') return 'outline';
    return 'default';
  };

  // Group by date
  const grouped = filtered.reduce<Record<string, CalendarEvent[]>>((acc, ev) => {
    if (!acc[ev.date]) acc[ev.date] = [];
    acc[ev.date].push(ev);
    return acc;
  }, {});

  if (filtered.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-12 text-muted-foreground">
        {t.noBookings}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-3 md:p-5">
      {Object.entries(grouped).map(([dateStr, dayEvents]) => {
        const dateObj = new Date(dateStr + 'T00:00:00');
        const dateLabel = format(dateObj, language === 'sk' ? 'EEEE d. MMMM' : 'EEEE, MMMM d', {
          locale: language === 'sk' ? undefined : undefined,
        });

        return (
          <div key={dateStr} className="mb-5">
            <h3 className="mb-2.5 text-sm font-bold uppercase tracking-wider text-[hsl(var(--soft-navy))]">
              {dateLabel}
            </h3>
            <div className="space-y-2">
              {dayEvents.map(ev => {
                const endTime = getEndTime(ev.startTime, ev.duration);
                return (
                  <div
                    key={ev.id}
                    onClick={() => onEditEvent(ev)}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl p-3 md:p-4 shadow-[0_8px_20px_rgba(126,195,255,0.1)] transition-all hover:shadow-[0_12px_28px_rgba(126,195,255,0.16)] ${getEventColorByCategory(ev.type, ev.status, ev.serviceId ? undefined : undefined)}`}
                  >
                    {/* Time block */}
                    <div className="flex-shrink-0 text-center min-w-[70px] md:min-w-[80px]">
                      <div className="text-base md:text-lg font-bold leading-tight">{ev.startTime}</div>
                      <div className="text-xs opacity-60">{endTime}</div>
                      <div className="mt-1 flex items-center justify-center gap-1 text-[10px] opacity-50">
                        <Clock className="h-3 w-3" />
                        {ev.duration} min
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      {ev.serviceName && (
                        <div className="text-sm md:text-base font-semibold truncate">{ev.serviceName}</div>
                      )}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <User className="h-3.5 w-3.5 opacity-60 flex-shrink-0" />
                        <span className="text-sm font-medium truncate">{ev.title}</span>
                      </div>
                      {(ev.clientPhone || ev.clientEmail) && (
                        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs opacity-70">
                          {ev.clientPhone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {ev.clientPhone}
                            </span>
                          )}
                          {ev.clientEmail && (
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="h-3 w-3" /> {ev.clientEmail}
                            </span>
                          )}
                        </div>
                      )}
                      {ev.employeeName && (
                        <div className="mt-1 text-xs opacity-50">{ev.employeeName}</div>
                      )}
                    </div>

                    {/* Status */}
                    <div className="flex-shrink-0">
                      <Badge variant={getStatusVariant(ev.status, ev.type)} className="text-[10px] md:text-xs">
                        {getStatusLabel(ev.status, ev.type)}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ListView;
