import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    <header className="flex flex-col md:flex-row items-center justify-between px-3 md:px-4 py-2 md:py-3 border-b border-border bg-card gap-3 flex-shrink-0">
      {/* Actions & Filter */}
      <div className="flex items-center justify-between w-full md:w-auto gap-3">
        <div className="flex gap-2">
          <Button size="sm" onClick={onCreateEvent} className="gap-1.5">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t.add}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={onCreateBlock} className="gap-1.5">
            <Ban className="w-4 h-4" />
            <span className="hidden md:inline">{t.block}</span>
          </Button>
        </div>

        <div className="flex items-center bg-secondary border border-border rounded-md px-2 py-1">
          <Users className="w-4 h-4 text-muted-foreground mr-2" />
          <select
            value={selectedTherapist}
            onChange={(e) => onTherapistChange(e.target.value)}
            className="bg-transparent text-xs md:text-sm font-medium text-foreground focus:outline-none"
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
        <div className="flex items-center border border-primary/30 rounded-md overflow-hidden bg-card flex-1 md:flex-none justify-between">
          <Button variant="ghost" size="icon" onClick={onPrev} className="rounded-none border-r border-primary/30 h-8 w-8">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="px-3 md:px-4 py-1 text-primary font-medium bg-accent text-xs md:text-sm text-center flex-1 whitespace-nowrap">
            {getRangeLabel()}
          </div>
          <Button variant="ghost" size="icon" onClick={onNext} className="rounded-none border-l border-primary/30 h-8 w-8">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button size="sm" onClick={onToday}>{t.today}</Button>
      </div>

      {/* View toggles */}
      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
          <input
            type="checkbox"
            checked={preventOverlap}
            onChange={(e) => onPreventOverlapChange(e.target.checked)}
            className="rounded border-border text-primary focus:ring-primary"
          />
          {t.noOverlap}
        </label>
        <div className="flex items-center gap-1 bg-secondary p-1 rounded-lg text-muted-foreground font-medium text-xs md:text-sm">
          {(['month', 'week', 'day'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className={`px-3 py-1 rounded-md transition-all ${
                viewMode === mode
                  ? 'bg-card shadow-sm text-primary font-bold'
                  : 'hover:text-foreground'
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
