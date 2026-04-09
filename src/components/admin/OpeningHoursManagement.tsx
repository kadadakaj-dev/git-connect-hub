import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Save, Clock, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { Database } from '@/integrations/supabase/types';

type Conflict = Database['public']['Functions']['get_opening_hours_conflicts']['Returns'][number];
type DayConfig = Database['public']['Tables']['time_slots_config']['Row'] | {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
};

const dayNames: Record<string, string[]> = {
  sk: ['Nedeľa', 'Pondelok', 'Utorok', 'Streda', 'Štvrtok', 'Piatok', 'Sobota'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

// Display order: Mon-Sun
const displayOrder = [1, 2, 3, 4, 5, 6, 0];

const OpeningHoursManagement = () => {
  const { language } = useLanguage();
  const qc = useQueryClient();
  const [configs, setConfigs] = useState<DayConfig[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const { data: serverConfigs, isLoading } = useQuery({
    queryKey: ['admin-time-slots-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('time_slots_config')
        .select('*')
        .order('day_of_week', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (serverConfigs) {
      // Create a config for each day, filling missing ones with defaults
      const mapped = displayOrder.map((day) => {
        const existing = serverConfigs.find((c) => c.day_of_week === day);
        return existing
          ? { id: existing.id, day_of_week: existing.day_of_week, start_time: existing.start_time, end_time: existing.end_time, is_active: existing.is_active }
          : { day_of_week: day, start_time: '09:00', end_time: '18:00', is_active: false };
      });
      setConfigs(mapped as DayConfig[]);
    }
  }, [serverConfigs]);

  const saveMutation = useMutation({
    mutationFn: async (allConfigs: DayConfig[]) => {
      for (const config of allConfigs) {
        if ('id' in config && config.id) {
          const { error } = await supabase
            .from('time_slots_config')
            .update({ start_time: config.start_time, end_time: config.end_time, is_active: config.is_active })
            .eq('id', config.id);
          if (error) throw error;
        } else if (config.is_active) {
          // Only create if active
          const { error } = await supabase
            .from('time_slots_config')
            .insert({ day_of_week: config.day_of_week, start_time: config.start_time, end_time: config.end_time, is_active: config.is_active });
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-time-slots-config'] });
      qc.invalidateQueries({ queryKey: ['timeSlots'] });
      qc.invalidateQueries({ queryKey: ['time-slots-config'] }); // Ensure global config is also invalidated
      toast.success(language === 'sk' ? 'Otváracie hodiny uložené' : 'Opening hours saved');
    },
    onError: () => toast.error(language === 'sk' ? 'Chyba pri ukladaní' : 'Error saving'),
  });
 
  const validateAndSave = async () => {
    setIsValidating(true);
    const allConflicts: Conflict[] = [];
    
    try {
      // Find days that changed
      const changedDays = configs.filter(config => {
        const original = serverConfigs?.find(c => c.day_of_week === config.day_of_week);
        if (!original) return config.is_active; // If it's a new active day, we don't worry about narrowing
        
        // We only care about ORPHANING bookings if the window NARROWED or day became INACTIVE
        const narrowed = (config.start_time > original.start_time) || 
                         (config.end_time < original.end_time) ||
                         (!config.is_active && original.is_active);
        return narrowed;
      });

      for (const dayConfig of changedDays) {
        const { data, error } = await supabase.rpc('get_opening_hours_conflicts', {
          p_day_of_week: dayConfig.day_of_week,
          p_new_start_time: dayConfig.is_active ? dayConfig.start_time : '23:59:59',
          p_new_end_time: dayConfig.is_active ? dayConfig.end_time : '00:00:00'
        });
        
        if (error) throw error;
        const normalizedData: Conflict[] = data ?? [];
        if (normalizedData.length > 0) {
          allConflicts.push(...normalizedData);
        }
      }

      if (allConflicts.length > 0) {
        setConflicts(allConflicts);
        setShowConflictModal(true);
      } else {
        saveMutation.mutate(configs);
      }
    } catch (err) {
      console.error('Error validating conflicts:', err);
      toast.error(language === 'sk' ? 'Chyba pri overovaní konfliktov' : 'Error checking for conflicts');
    } finally {
      setIsValidating(false);
    }
  };

  const updateDay = (index: number, updates: Partial<DayConfig>) => {
    setConfigs((prev) => prev.map((c, i) => (i === index ? { ...c, ...updates } : c)));
  };

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <Card className="rounded-[24px] border-[var(--glass-border-subtle)] bg-white/60">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5" />
            {language === 'sk' ? 'Otváracie hodiny' : 'Opening Hours'}
          </CardTitle>
          <CardDescription className="text-xs">
            {language === 'sk' ? 'Nastavte pracovné hodiny pre každý deň v týždni' : 'Set working hours for each day of the week'}
          </CardDescription>
        </div>
        <Button 
          onClick={validateAndSave} 
          disabled={saveMutation.isPending || isValidating} 
          size="sm"
        >
          {saveMutation.isPending || isValidating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {language === 'sk' ? 'Uložiť' : 'Save'}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* ... existing config map ... */}
          {configs.map((config, index) => (
            <div
              key={config.day_of_week}
              className={`flex items-center gap-2 sm:gap-4 p-3 rounded-[16px] border transition-colors ${
                config.is_active ? 'bg-white/60 border-[var(--glass-border-subtle)]' : 'bg-muted/20 border-[var(--glass-border-subtle)]/50'
              }`}
            >
              <Switch
                checked={config.is_active}
                onCheckedChange={(v) => updateDay(index, { is_active: v })}
              />
              <span className={`w-20 sm:w-24 font-medium text-xs sm:text-sm ${config.is_active ? 'text-foreground' : 'text-muted-foreground'}`}>
                {dayNames[language][config.day_of_week]}
              </span>
              {config.is_active ? (
                <div className="flex items-center gap-1 sm:gap-2">
                  <Label className="text-xs text-muted-foreground hidden sm:inline">{language === 'sk' ? 'Od' : 'From'}</Label>
                  <Input
                    type="time"
                    value={config.start_time}
                    onChange={(e) => updateDay(index, { start_time: e.target.value })}
                    className="w-24 sm:w-28"
                  />
                  <Label className="text-xs text-muted-foreground hidden sm:inline">{language === 'sk' ? 'Do' : 'To'}</Label>
                  <Input
                    type="time"
                    value={config.end_time}
                    onChange={(e) => updateDay(index, { end_time: e.target.value })}
                    className="w-24 sm:w-28"
                  />
                </div>
              ) : (
                <span className="text-sm text-muted-foreground italic">
                  {language === 'sk' ? 'Zatvorené' : 'Closed'}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Conflict Warning Modal */}
        <Dialog open={showConflictModal} onOpenChange={setShowConflictModal}>
          <DialogContent className="rounded-[24px] border-[var(--glass-border-subtle)] bg-white/95 backdrop-blur-xl max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-5 h-5" />
                {language === 'sk' ? 'Zistené konflikty' : 'Conflicts Detected'}
              </DialogTitle>
              <DialogDescription className="text-sm pt-2">
                {language === 'sk' 
                  ? 'Nasledovné existujúce rezervácie budú po zmene pracovných hodín mimo povoleného času:' 
                  : 'The following existing bookings will fall outside the new business hours:'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="max-h-[300px] overflow-y-auto py-4 space-y-2">
              {conflicts.map((conflict) => (
                <div key={conflict.booking_id} className="p-3 rounded-[12px] border border-red-100 bg-red-50/50 flex flex-col gap-1">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span>{new Date(conflict.booking_date).toLocaleDateString(language === 'sk' ? 'sk-SK' : 'en-US')}</span>
                    <Badge variant="outline" className="text-[10px] bg-white">{conflict.booking_time}</Badge>
                  </div>
                  <div className="text-sm font-medium">{conflict.client_name}</div>
                  <div className="text-[11px] text-muted-foreground italic">
                    {language === 'sk' ? conflict.service_name_sk : conflict.service_name_en}
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" size="sm" onClick={() => setShowConflictModal(false)}>
                {language === 'sk' ? 'Zrušiť' : 'Cancel'}
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => {
                  setShowConflictModal(false);
                  saveMutation.mutate(configs);
                }}
              >
                {language === 'sk' ? 'Uložiť aj tak' : 'Save Anyway'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default OpeningHoursManagement;
