
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Ban,
  CalendarDays,
  Clock,
  User,
  Trash2,
  Repeat,
} from 'lucide-react';
import { Employee } from './types';
import type { Language } from '@/i18n/translations';

export interface ServiceOption {
  id: string;
  name_sk: string;
  name_en: string;
  duration: number;
  price: number;
  category: string;
}

export interface EventFormData {
  id: string;
  date: string;
  startTime: string;
  duration: number;
  title: string;
  type: 'booking' | 'block';
  notes: string;
  therapistId: string;
  isRecurring: boolean;
  recurringWeeks: number;
  clientEmail?: string;
  clientPhone?: string;
  serviceId?: string;
  blockScope?: 'day' | 'week' | 'month';
}

interface EventModalProps {
  language: Language;
  isOpen: boolean;
  mode: 'create' | 'edit';
  formData: EventFormData;
  employees: Employee[];
  services?: ServiceOption[];
  onClose: () => void;
  onChange: (data: Partial<EventFormData>) => void;
  onSave: () => void;
  onDelete: () => void;
}

const EventModal = ({
  language,
  isOpen,
  mode,
  formData,
  employees,
  services = [],
  onClose,
  onChange,
  onSave,
  onDelete,
}: EventModalProps) => {
  const t = {
    newItem: language === 'sk' ? 'Nová položka' : 'New item',
    editItem: language === 'sk' ? 'Detail položky' : 'Item details',
    therapist: language === 'sk' ? 'Terapeut' : 'Therapist',
    type: language === 'sk' ? 'Typ záznamu' : 'Record type',
    physio: language === 'sk' ? '🩺 Rezervácia' : '🩺 Booking',
    block: language === 'sk' ? '🚫 Blokovaný čas' : '🚫 Blocked time',
    reason: language === 'sk' ? 'Dôvod' : 'Reason',
    clientName: language === 'sk' ? 'Meno klienta' : 'Client name',
    date: language === 'sk' ? 'Dátum' : 'Date',
    time: language === 'sk' ? 'Čas' : 'Time',
    duration: language === 'sk' ? 'Trvanie' : 'Duration',
    repeatWeekly: language === 'sk' ? 'Opakovať týždenne' : 'Repeat weekly',
    weeks2: language === 'sk' ? '2 týž.' : '2 wks',
    weeks4: language === 'sk' ? '4 týž.' : '4 wks',
    weeks8: language === 'sk' ? '8 týž.' : '8 wks',
    note: language === 'sk' ? 'Poznámka' : 'Note',
    notePlaceholder: language === 'sk' ? 'Voliteľné poznámky...' : 'Optional notes...',
    namePlaceholder: language === 'sk' ? 'Meno a Priezvisko...' : 'Name...',
    email: language === 'sk' ? 'Email klienta' : 'Client email',
    phone: language === 'sk' ? 'Telefón klienta' : 'Client phone',
    emailPlaceholder: language === 'sk' ? 'email@priklad.sk' : 'email@example.com',
    phonePlaceholder: language === 'sk' ? '+421...' : '+421...',
    service: language === 'sk' ? 'Služba' : 'Service',
    noService: language === 'sk' ? '— Bez služby —' : '— No service —',
    delete: language === 'sk' ? 'Zmazať' : 'Delete',
    cancel: language === 'sk' ? 'Zrušiť' : 'Cancel',
    save: language === 'sk' ? 'Uložiť' : 'Save',
    blockScope: language === 'sk' ? 'Rozsah blokácie' : 'Block scope',
    scopeDay: language === 'sk' ? 'Deň' : 'Day',
    scopeWeek: language === 'sk' ? 'Týždeň' : 'Week',
    scopeMonth: language === 'sk' ? 'Mesiac' : 'Month',
  };

  const handleServiceChange = (serviceId: string) => {
    if (!serviceId) {
      onChange({ serviceId: '' });
      return;
    }
    const svc = services.find(s => s.id === serviceId);
    if (svc) {
      onChange({ serviceId, duration: svc.duration });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg rounded-[28px] border-[var(--glass-border)] bg-[var(--glass-white-lg)] shadow-glass-float max-h-[92svh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-[hsl(var(--soft-navy))]">
            {formData.type === 'block'
              ? <Ban className="w-5 h-5 text-muted-foreground" />
              : <CalendarDays className="w-5 h-5 text-primary" />
            }
            {mode === 'create' ? t.newItem : t.editItem}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {language === 'sk' 
              ? 'Formulár na správu kalendárových udalostí a blokácií' 
              : 'Form for managing calendar events and blocks'}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable form area */}
        <div className="flex-1 overflow-y-auto overscroll-contain space-y-3 sm:space-y-4 px-0.5 -mx-0.5">
          <div className={`grid ${formData.type === 'block' ? 'grid-cols-1' : 'grid-cols-2'} gap-2 sm:gap-3`}>
            {formData.type !== 'block' && (
              <div>
                <label className="block text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase mb-1 sm:mb-1.5">{t.therapist}</label>
                <select
                  value={formData.therapistId}
                  onChange={(e) => onChange({ therapistId: e.target.value })}
                  className="w-full rounded-[14px] sm:rounded-[16px] border border-[var(--glass-border-subtle)] bg-white/72 p-2 sm:p-2.5 text-sm font-medium text-[hsl(var(--soft-navy))] shadow-[0_10px_24px_rgba(126,195,255,0.08)] focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {!formData.therapistId && (
                    <option value="" disabled>{language === 'sk' ? 'Vyberte' : 'Select'}</option>
                  )}
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase mb-1 sm:mb-1.5">{t.type}</label>
              <select
                value={formData.type}
                onChange={(e) => onChange({ type: e.target.value as 'booking' | 'block' })}
                className="w-full rounded-[14px] sm:rounded-[16px] border border-[var(--glass-border-subtle)] bg-white/72 p-2 sm:p-2.5 text-sm font-medium text-[hsl(var(--soft-navy))] shadow-[0_10px_24px_rgba(126,195,255,0.08)] focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="booking">{t.physio}</option>
                <option value="block">{t.block}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase mb-1 sm:mb-1.5">
              {formData.type === 'block' ? t.reason : t.clientName}
            </label>
            <div className="relative">
              {formData.type !== 'block' && <User className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5 sm:top-3" />}
              <Input
                value={formData.title}
                onChange={(e) => onChange({ title: e.target.value })}
                className={`h-9 sm:h-10 ${formData.type !== 'block' ? 'pl-9' : ''}`}
                placeholder={t.namePlaceholder}
              />
            </div>
          </div>

          {formData.type === 'booking' && mode === 'create' && (
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label className="block text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase mb-1 sm:mb-1.5">{t.email} *</label>
                <Input
                  type="email"
                  value={formData.clientEmail || ''}
                  onChange={(e) => onChange({ clientEmail: e.target.value })}
                  placeholder={t.emailPlaceholder}
                  className="h-9 sm:h-10"
                />
              </div>
              <div>
                <label className="block text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase mb-1 sm:mb-1.5">{t.phone}</label>
                <Input
                  type="tel"
                  value={formData.clientPhone || ''}
                  onChange={(e) => onChange({ clientPhone: e.target.value })}
                  placeholder={t.phonePlaceholder}
                  className="h-9 sm:h-10"
                />
              </div>
            </div>
          )}

          {formData.type === 'booking' && mode === 'create' && services.length > 0 && (
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase mb-1 sm:mb-1.5">{t.service}</label>
              <select
                value={formData.serviceId || ''}
                onChange={(e) => handleServiceChange(e.target.value)}
                className="w-full rounded-[14px] sm:rounded-[16px] border border-[var(--glass-border-subtle)] bg-white/72 p-2 sm:p-2.5 text-sm font-medium text-[hsl(var(--soft-navy))] shadow-[0_10px_24px_rgba(126,195,255,0.08)] focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">{t.noService}</option>
                {services.map(svc => (
                  <option key={svc.id} value={svc.id}>
                    {language === 'sk' ? svc.name_sk : svc.name_en} — {svc.duration}min / {svc.price}€
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={`grid ${formData.type === 'block' ? 'grid-cols-1' : 'grid-cols-3'} gap-2 sm:gap-3`}>
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase mb-1 sm:mb-1.5">{t.date}</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => onChange({ date: e.target.value })}
                className="h-9 sm:h-10 text-xs sm:text-sm"
              />
            </div>
            {formData.type !== 'block' && (
              <>
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase mb-1 sm:mb-1.5">{t.time}</label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => onChange({ startTime: e.target.value })}
                    className="h-9 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase mb-1 sm:mb-1.5">{t.duration}</label>
                  <select
                    value={formData.duration}
                    onChange={(e) => onChange({ duration: Number(e.target.value) })}
                    className="w-full rounded-[14px] sm:rounded-[16px] border border-[var(--glass-border-subtle)] bg-white/72 p-2 sm:p-2.5 text-xs sm:text-sm text-[hsl(var(--soft-navy))] shadow-[0_10px_24px_rgba(126,195,255,0.08)] focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="15">15m</option>
                    <option value="30">30m</option>
                    <option value="45">45m</option>
                    <option value="60">60m</option>
                    <option value="90">90m</option>
                    <option value="120">120m</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {formData.type === 'block' && mode === 'create' && (
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase mb-1 sm:mb-1.5">{t.blockScope}</label>
              <div className="grid grid-cols-3 gap-2">
                {(['day', 'week', 'month'] as const).map((scope) => {
                  const label = scope === 'day' ? t.scopeDay : scope === 'week' ? t.scopeWeek : t.scopeMonth;
                  const active = (formData.blockScope || 'day') === scope;
                  return (
                    <button
                      key={scope}
                      type="button"
                      onClick={() => onChange({ blockScope: scope })}
                      className={`rounded-[14px] sm:rounded-[16px] border py-2 text-xs font-semibold transition-all ${
                        active
                          ? 'border-primary/40 bg-primary/10 text-primary shadow-[0_4px_12px_rgba(79,149,213,0.15)]'
                          : 'border-[var(--glass-border-subtle)] bg-white/70 text-[hsl(var(--soft-navy))] hover:bg-white/82'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {formData.type === 'booking' && mode === 'create' && (
            <div className="flex items-center gap-3 sm:gap-4 bg-white/62 p-2.5 sm:p-3 rounded-[16px] sm:rounded-[18px] border border-[var(--glass-border-subtle)] shadow-[0_10px_24px_rgba(126,195,255,0.08)]">
              <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[hsl(var(--soft-navy))] cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e) => onChange({ isRecurring: e.target.checked })}
                  className="rounded border-[var(--glass-border)] text-primary focus:ring-primary"
                />
                <Repeat className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                {t.repeatWeekly}
              </label>
              {formData.isRecurring && (
                <select
                  value={formData.recurringWeeks}
                  onChange={(e) => onChange({ recurringWeeks: Number(e.target.value) })}
                  className="rounded-md border border-[var(--glass-border-subtle)] bg-white/72 p-1 text-xs text-[hsl(var(--soft-navy))]"
                >
                  <option value="2">{t.weeks2}</option>
                  <option value="4">{t.weeks4}</option>
                  <option value="8">{t.weeks8}</option>
                </select>
              )}
            </div>
          )}

          {formData.type !== 'block' && (
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase mb-1 sm:mb-1.5">{t.note}</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => onChange({ notes: e.target.value })}
                rows={2}
                placeholder={t.notePlaceholder}
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between gap-2 flex-shrink-0 pt-2 sm:pt-3 border-t border-[var(--glass-border-subtle)]">
          <div>
            {mode === 'edit' && (
              <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1 sm:gap-1.5">
                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {t.delete}
              </Button>
            )}
          </div>
          <div className="flex gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-[14px] sm:rounded-[16px] border-[var(--glass-border-subtle)] bg-white/70 text-[hsl(var(--soft-navy))] hover:bg-white/82 text-xs sm:text-sm"
            >
              {t.cancel}
            </Button>
            <Button
              size="sm"
              onClick={onSave}
              className="rounded-[14px] sm:rounded-[16px] border border-white/20 bg-[linear-gradient(135deg,#24476B_0%,#4F95D5_100%)] shadow-[0_16px_30px_rgba(79,149,213,0.22)] hover:brightness-[1.03] text-xs sm:text-sm"
            >
              {t.save}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EventModal;
