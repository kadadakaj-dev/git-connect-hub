import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
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
}

interface EventModalProps {
  language: Language;
  isOpen: boolean;
  mode: 'create' | 'edit';
  formData: EventFormData;
  employees: Employee[];
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
    weeks2: language === 'sk' ? '2 týždne' : '2 weeks',
    weeks4: language === 'sk' ? '4 týždne' : '4 weeks',
    weeks8: language === 'sk' ? '8 týždňov' : '8 weeks',
    note: language === 'sk' ? 'Poznámka' : 'Note',
    notePlaceholder: language === 'sk' ? 'Voliteľné poznámky...' : 'Optional notes...',
    namePlaceholder: language === 'sk' ? 'Meno a Priezvisko...' : 'Name...',
    email: language === 'sk' ? 'Email klienta' : 'Client email',
    phone: language === 'sk' ? 'Telefón klienta' : 'Client phone',
    emailPlaceholder: language === 'sk' ? 'email@priklad.sk' : 'email@example.com',
    phonePlaceholder: language === 'sk' ? '+421...' : '+421...',
    delete: language === 'sk' ? 'Zmazať' : 'Delete',
    cancel: language === 'sk' ? 'Zrušiť' : 'Cancel',
    save: language === 'sk' ? 'Uložiť' : 'Save',
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg rounded-[28px] border-[var(--glass-border)] bg-[var(--glass-white-lg)] shadow-glass-float">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[hsl(var(--soft-navy))]">
            {formData.type === 'block'
              ? <Ban className="w-5 h-5 text-muted-foreground" />
              : <CalendarDays className="w-5 h-5 text-primary" />
            }
            {mode === 'create' ? t.newItem : t.editItem}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1.5">{t.therapist}</label>
              <select
                value={formData.therapistId}
                onChange={(e) => onChange({ therapistId: e.target.value })}
                className="w-full rounded-[16px] border border-[var(--glass-border-subtle)] bg-white/72 p-2.5 text-sm font-medium text-[hsl(var(--soft-navy))] shadow-[0_10px_24px_rgba(126,195,255,0.08)] focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {!formData.therapistId && (
                  <option value="" disabled>{language === 'sk' ? 'Vyberte terapeuta' : 'Select therapist'}</option>
                )}
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1.5">{t.type}</label>
              <select
                value={formData.type}
                onChange={(e) => onChange({ type: e.target.value as 'booking' | 'block' })}
                className="w-full rounded-[16px] border border-[var(--glass-border-subtle)] bg-white/72 p-2.5 text-sm font-medium text-[hsl(var(--soft-navy))] shadow-[0_10px_24px_rgba(126,195,255,0.08)] focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="booking">{t.physio}</option>
                <option value="block">{t.block}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1.5">
              {formData.type === 'block' ? t.reason : t.clientName}
            </label>
            <div className="relative">
              {formData.type !== 'block' && <User className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />}
              <Input
                value={formData.title}
                onChange={(e) => onChange({ title: e.target.value })}
                className={formData.type !== 'block' ? 'pl-9' : ''}
                placeholder={t.namePlaceholder}
              />
            </div>
          </div>

          {formData.type === 'booking' && mode === 'create' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1.5">{t.email} *</label>
                <Input
                  type="email"
                  value={formData.clientEmail || ''}
                  onChange={(e) => onChange({ clientEmail: e.target.value })}
                  placeholder={t.emailPlaceholder}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1.5">{t.phone}</label>
                <Input
                  type="tel"
                  value={formData.clientPhone || ''}
                  onChange={(e) => onChange({ clientPhone: e.target.value })}
                  placeholder={t.phonePlaceholder}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1.5">{t.date}</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => onChange({ date: e.target.value })}
              />
            </div>
            <div className="min-w-0">
              <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1.5">{t.time}</label>
              <div className="relative">
                <Clock className="w-4 h-4 text-muted-foreground absolute left-3 top-3 hidden sm:block" />
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => onChange({ startTime: e.target.value })}
                  className="sm:pl-9"
                />
              </div>
            </div>
            <div className="min-w-0">
              <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1.5">{t.duration}</label>
              <select
                value={formData.duration}
                onChange={(e) => onChange({ duration: Number(e.target.value) })}
                className="w-full rounded-[16px] border border-[var(--glass-border-subtle)] bg-white/72 p-2.5 text-sm text-[hsl(var(--soft-navy))] shadow-[0_10px_24px_rgba(126,195,255,0.08)] focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">60 min</option>
                <option value="90">90 min</option>
                <option value="120">120 min</option>
              </select>
            </div>
          </div>

          {/* Recurring */}
          {mode === 'create' && (
            <div className="flex items-center gap-4 bg-white/62 p-3 rounded-[18px] border border-[var(--glass-border-subtle)] shadow-[0_10px_24px_rgba(126,195,255,0.08)]">
              <label className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--soft-navy))] cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isRecurring}
                  onChange={(e) => onChange({ isRecurring: e.target.checked })}
                  className="rounded border-[var(--glass-border)] text-primary focus:ring-primary"
                />
                <Repeat className="w-4 h-4 text-muted-foreground" />
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

          <div>
            <label className="block text-[11px] font-bold text-muted-foreground uppercase mb-1.5">{t.note}</label>
            <Textarea
              value={formData.notes}
              onChange={(e) => onChange({ notes: e.target.value })}
              rows={2}
              placeholder={t.notePlaceholder}
            />
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between gap-2">
          <div>
            {mode === 'edit' && (
              <Button variant="ghost" onClick={onDelete} className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5">
                <Trash2 className="w-4 h-4" />
                {t.delete}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-[16px] border-[var(--glass-border-subtle)] bg-white/70 text-[hsl(var(--soft-navy))] hover:bg-white/82 hover:text-[hsl(var(--navy))]"
            >
              {t.cancel}
            </Button>
            <Button
              onClick={onSave}
              className="rounded-[16px] border border-white/20 bg-[linear-gradient(135deg,#24476B_0%,#4F95D5_100%)] shadow-[0_16px_30px_rgba(79,149,213,0.22)] hover:brightness-[1.03]"
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
