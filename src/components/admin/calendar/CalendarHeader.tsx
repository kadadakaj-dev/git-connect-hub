import { Button } from '@/components/ui/button';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  Plus,
  Ban,
  ChevronLeft,
  ChevronRight,
  List,
} from 'lucide-react';
import { format } from 'date-fns';
import { ViewMode, Employee } from './types';
import { getLocale, getWeekStart } from './utils';
import { addDays } from 'date-fns';
import type { Language } from '@/i18n/translations';

interface CalendarHeaderProps {
  language: Language;
  currentDate: Date;
  viewMode: ViewMode;
  selectedTherapist: string;
  preventOverlap: boolean;
  employees: Employee[];
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewModeChange: (mode: ViewMode) => void;
  onTherapistChange: (id: string) => void;
  onPreventOverlapChange: (value: boolean) => void;
  onCreateEvent: () => void;
  onCreateBlock: () => void;
}

const CalendarHeader = ({
  language,
  currentDate,
  viewMode,
  selectedTherapist,
  preventOverlap,
  employees,
  onPrev,
  onNext,
  onToday,
  onViewModeChange,
  onTherapistChange,
  onPreventOverlapChange,
  onCreateEvent,
  onCreateBlock,
}: CalendarHeaderProps) => {
  const locale = getLocale(language);

  const getRangeLabel = () => {
    if (viewMode === 'day') return format(currentDate, 'EEE d. MMMM', { locale });
    if (viewMode === 'week') {
      const weekStart = getWeekStart(currentDate);
      const weekEnd = addDays(weekStart, 6);
      return `${format(weekStart, 'd. MMM', { locale })} – ${format(weekEnd, 'd. MMM yyyy', { locale })}`;
    }
    return format(currentDate, 'LLLL yyyy', { locale });
  };

  const t = {
    add: language === 'sk' ? 'Pridať' : 'Add',
    block: language === 'sk' ? 'Blokovať' : 'Block',
    allEmployees: language === 'sk' ? 'Všetci' : 'All',
    today: language === 'sk' ? 'Dnes' : 'Today',
    noOverlap: language === 'sk' ? 'Zákaz prekrývania' : 'No overlap',
    month: language === 'sk' ? 'Mesiac' : 'Month',
    week: language === 'sk' ? 'Týždeň' : 'Week',
    day: language === 'sk' ? 'Deň' : 'Day',
  };

  return (
    <header className="flex flex-col items-center justify-between gap-3 border-b border-[var(--glass-border-subtle)] bg-[linear-gradient(180deg,rgba(255,255,255,0.62)_0%,rgba(234,246,255,0.36)_100%)] px-4 py-3 backdrop-blur-xl md:flex-row md:px-5 md:py-3.5 flex-shrink-0">
      {/* Actions & Filter */}
      <div className="flex items-center justify-between w-full md:w-auto gap-2.5">
        <div className="flex gap-1.5">
          <Button
            size="sm"
            onClick={onCreateEvent}
            className="h-9 gap-1.5 rounded-[16px] border border-white/20 bg-[linear-gradient(135deg,#24476B_0%,#4F95D5_100%)] px-3 text-xs font-medium shadow-[0_16px_30px_rgba(79,149,213,0.22)] hover:brightness-[1.03]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.add}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCreateBlock}
            className="h-9 gap-1.5 rounded-[16px] border-[var(--glass-border-subtle)] bg-white/70 px-3 text-xs font-medium text-[hsl(var(--soft-navy))] shadow-[0_10px_24px_rgba(126,195,255,0.1)] hover:bg-white/82 hover:text-[hsl(var(--navy))]"
          >
            <Ban className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{t.block}</span>
          </Button>
        </div>

        <div className="flex items-center rounded-[16px] border border-[var(--glass-border-subtle)] bg-white/70 px-2.5 py-1.5 shadow-[0_10px_24px_rgba(126,195,255,0.1)]">
          <Users className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={selectedTherapist}
            onChange={(e) => onTherapistChange(e.target.value)}
            className="cursor-pointer bg-transparent text-xs font-medium text-[hsl(var(--soft-navy))] focus:outline-none"
          >
            <option value="all">{t.allEmployees}</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.full_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between w-full md:w-auto gap-2">
        <div className="flex flex-1 items-center justify-between overflow-hidden rounded-[18px] border border-[var(--glass-border-subtle)] bg-white/74 shadow-[0_14px_28px_rgba(126,195,255,0.12)] md:flex-none">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrev}
            className="h-9 w-9 rounded-none border-r border-[var(--glass-border-subtle)] hover:bg-white/70"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </Button>
          <div className="flex-1 whitespace-nowrap bg-[linear-gradient(180deg,rgba(255,255,255,0.5)_0%,rgba(234,246,255,0.28)_100%)] px-4 py-2 text-center text-xs font-semibold tracking-wide text-[hsl(var(--soft-navy))] md:px-5">
            {getRangeLabel()}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNext}
            className="h-9 w-9 rounded-none border-l border-[var(--glass-border-subtle)] hover:bg-white/70"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onToday}
          className="h-9 rounded-[16px] border-[var(--glass-border-subtle)] bg-white/70 px-3 text-xs font-medium text-[hsl(var(--soft-navy))] shadow-[0_10px_24px_rgba(126,195,255,0.1)] hover:bg-white/82 hover:text-[hsl(var(--navy))]"
        >
          {t.today}
        </Button>
      </div>

      {/* View toggles */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
        <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-[hsl(var(--soft-navy))]">
          <input
            type="checkbox"
            checked={preventOverlap}
            onChange={(e) => onPreventOverlapChange(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-[var(--glass-border)] text-primary focus:ring-primary/30"
          />
          {t.noOverlap}
        </label>
        <LayoutGroup>
          <div className="relative flex items-center gap-0.5 rounded-[16px] border border-[var(--glass-border-subtle)] bg-white/58 p-1 text-xs font-medium text-muted-foreground shadow-[0_10px_24px_rgba(126,195,255,0.08)]">
            {(['month', 'week', 'day'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => onViewModeChange(mode)}
                className={`relative z-10 rounded-[12px] px-3 py-1.5 text-[11px] tracking-wide transition-colors duration-200 ${
                  viewMode === mode
                    ? 'font-semibold text-[hsl(var(--navy))]'
                    : 'hover:bg-white/52 hover:text-[hsl(var(--soft-navy))]'
                }`}
              >
                {viewMode === mode && (
                  <motion.span
                    layoutId="activeViewTab"
                    className="absolute inset-0 rounded-[12px] border border-[var(--glass-border-subtle)] bg-white/84 shadow-[0_12px_24px_rgba(126,195,255,0.12)]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{t[mode]}</span>
              </button>
            ))}
          </div>
        </LayoutGroup>
      </div>
    </header>
  );
};

export default CalendarHeader;
