import { Button } from '@/components/ui/button';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  Plus,
  Ban,
  ChevronLeft,
  ChevronRight,
  Users,
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
    <header className="flex flex-col md:flex-row items-center justify-between px-4 md:px-5 py-3 md:py-3.5 border-b border-border/40 bg-card gap-3 flex-shrink-0">
      {/* Actions & Filter */}
      <div className="flex items-center justify-between w-full md:w-auto gap-2.5">
        <div className="flex gap-1.5">
          <Button size="sm" onClick={onCreateEvent} className="gap-1.5 h-8 rounded-lg text-xs font-medium shadow-sm">
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.add}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={onCreateBlock} className="gap-1.5 h-8 rounded-lg text-xs font-medium border-border/50 shadow-sm">
            <Ban className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{t.block}</span>
          </Button>
        </div>

        <div className="flex items-center bg-muted/50 border border-border/30 rounded-lg px-2.5 py-1.5">
          <Users className="w-3.5 h-3.5 text-muted-foreground mr-2" />
          <select
            value={selectedTherapist}
            onChange={(e) => onTherapistChange(e.target.value)}
            className="bg-transparent text-xs font-medium text-foreground focus:outline-none cursor-pointer"
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
        <div className="flex items-center border border-border/30 rounded-lg overflow-hidden bg-card flex-1 md:flex-none justify-between shadow-sm">
          <Button variant="ghost" size="icon" onClick={onPrev} className="rounded-none border-r border-border/20 h-8 w-8 hover:bg-muted/50">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </Button>
          <div className="px-4 md:px-5 py-1.5 text-primary font-semibold bg-accent/40 text-xs tracking-wide text-center flex-1 whitespace-nowrap">
            {getRangeLabel()}
          </div>
          <Button variant="ghost" size="icon" onClick={onNext} className="rounded-none border-l border-border/20 h-8 w-8 hover:bg-muted/50">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
        <Button size="sm" variant="outline" onClick={onToday} className="h-8 rounded-lg text-xs font-medium border-border/50 shadow-sm">
          {t.today}
        </Button>
      </div>

      {/* View toggles */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
        <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
          <input
            type="checkbox"
            checked={preventOverlap}
            onChange={(e) => onPreventOverlapChange(e.target.checked)}
            className="rounded border-border/50 text-primary focus:ring-primary/30 w-3.5 h-3.5"
          />
          {t.noOverlap}
        </label>
        <div className="flex items-center gap-0.5 bg-muted/40 p-0.5 rounded-lg text-muted-foreground font-medium text-xs">
          {(['month', 'week', 'day'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className={`px-3 py-1.5 rounded-md transition-all text-[11px] tracking-wide ${
                viewMode === mode
                  ? 'bg-card shadow-sm text-primary font-semibold'
                  : 'hover:text-foreground hover:bg-card/50'
              }`}
            >
              {t[mode]}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};

export default CalendarHeader;
