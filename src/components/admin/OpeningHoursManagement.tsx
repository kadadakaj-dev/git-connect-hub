import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Save, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

interface DayConfig {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

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
          : { day_of_week: day, start_time: '09:30', end_time: '18:30', is_active: false };
      });
      setConfigs(mapped);
    }
  }, [serverConfigs]);

  const saveMutation = useMutation({
    mutationFn: async (allConfigs: DayConfig[]) => {
      for (const config of allConfigs) {
        if (config.id) {
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
      toast.success(language === 'sk' ? 'Otváracie hodiny uložené' : 'Opening hours saved');
    },
    onError: () => toast.error(language === 'sk' ? 'Chyba pri ukladaní' : 'Error saving'),
  });

  const updateDay = (index: number, updates: Partial<DayConfig>) => {
    setConfigs((prev) => prev.map((c, i) => (i === index ? { ...c, ...updates } : c)));
  };

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {language === 'sk' ? 'Otváracie hodiny' : 'Opening Hours'}
          </CardTitle>
          <CardDescription>
            {language === 'sk' ? 'Nastavte pracovné hodiny pre každý deň v týždni' : 'Set working hours for each day of the week'}
          </CardDescription>
        </div>
        <Button onClick={() => saveMutation.mutate(configs)} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {language === 'sk' ? 'Uložiť' : 'Save'}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {configs.map((config, index) => (
            <div
              key={config.day_of_week}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                config.is_active ? 'bg-background border-border' : 'bg-muted/30 border-border/30'
              }`}
            >
              <Switch
                checked={config.is_active}
                onCheckedChange={(v) => updateDay(index, { is_active: v })}
              />
              <span className={`w-28 font-medium text-sm ${config.is_active ? 'text-foreground' : 'text-muted-foreground'}`}>
                {dayNames[language][config.day_of_week]}
              </span>
              {config.is_active ? (
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">{language === 'sk' ? 'Od' : 'From'}</Label>
                  <Input
                    type="time"
                    value={config.start_time}
                    onChange={(e) => updateDay(index, { start_time: e.target.value })}
                    className="w-32"
                  />
                  <Label className="text-xs text-muted-foreground">{language === 'sk' ? 'Do' : 'To'}</Label>
                  <Input
                    type="time"
                    value={config.end_time}
                    onChange={(e) => updateDay(index, { end_time: e.target.value })}
                    className="w-32"
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
      </CardContent>
    </Card>
  );
};

export default OpeningHoursManagement;
