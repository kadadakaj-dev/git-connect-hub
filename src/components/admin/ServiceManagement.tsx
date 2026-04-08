import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2,
  Activity,
  Bone,
  Hand,
  ClipboardCheck,
  Dumbbell,
  MessageSquare,
  Stethoscope
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const ICON_MAP = {
  Activity,
  Bone,
  Hand,
  ClipboardCheck,
  Dumbbell,
  MessageSquare,
  Stethoscope
};

interface ServiceFormData {
  id?: string;
  name_sk: string;
  name_en: string;
  description_sk: string;
  description_en: string;
  duration: number;
  price: number;
  category: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
}

const defaultFormData: ServiceFormData = {
  name_sk: '',
  name_en: '',
  description_sk: '',
  description_en: '',
  duration: 30,
  price: 0,
  category: 'chiropractic',
  icon: 'Activity',
  is_active: true,
  sort_order: 0,
};

const iconOptions = [
  'Activity',
  'Bone',
  'Hand',
  'ClipboardCheck',
  'Dumbbell',
  'MessageSquare',
  'Stethoscope',
];

const ServiceManagement = () => {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceFormData | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>(defaultFormData);

  const { data: services, isLoading } = useQuery({
    queryKey: ['admin-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ServiceFormData) => {
      const { error } = await supabase.from('services').insert({
        name_sk: data.name_sk,
        name_en: data.name_en,
        description_sk: data.description_sk,
        description_en: data.description_en,
        duration: data.duration,
        price: data.price,
        category: data.category,
        icon: data.icon,
        is_active: data.is_active,
        sort_order: data.sort_order,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success(language === 'sk' ? 'Služba vytvorená' : 'Service created');
      resetForm();
    },
    onError: () => {
      toast.error(language === 'sk' ? 'Chyba pri vytváraní' : 'Error creating service');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ServiceFormData) => {
      const { error } = await supabase
        .from('services')
        .update({
          name_sk: data.name_sk,
          name_en: data.name_en,
          description_sk: data.description_sk,
          description_en: data.description_en,
          duration: data.duration,
          price: data.price,
          category: data.category,
          icon: data.icon,
          is_active: data.is_active,
          sort_order: data.sort_order,
        })
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success(language === 'sk' ? 'Služba aktualizovaná' : 'Service updated');
      resetForm();
    },
    onError: () => {
      toast.error(language === 'sk' ? 'Chyba pri aktualizácii' : 'Error updating service');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-services'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success(language === 'sk' ? 'Služba zmazaná' : 'Service deleted');
    },
    onError: () => {
      toast.error(
        language === 'sk'
          ? 'Chyba pri mazaní (možno existujú rezervácie)'
          : 'Error deleting (bookings may exist)'
      );
    },
  });

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingService(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (service: ServiceFormData) => {
    setEditingService({
      id: service.id,
      name_sk: service.name_sk,
      name_en: service.name_en,
      description_sk: service.description_sk,
      description_en: service.description_en,
      duration: service.duration,
      price: Number(service.price),
      category: service.category,
      icon: service.icon,
      is_active: service.is_active,
      sort_order: service.sort_order,
    });
    setFormData({
      id: service.id,
      name_sk: service.name_sk,
      name_en: service.name_en,
      description_sk: service.description_sk,
      description_en: service.description_en,
      duration: service.duration,
      price: Number(service.price),
      category: service.category,
      icon: service.icon,
      is_active: service.is_active,
      sort_order: service.sort_order,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingService) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm(language === 'sk' ? 'Naozaj chcete zmazať túto službu?' : 'Are you sure you want to delete this service?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="rounded-[24px] border-[var(--glass-border-subtle)] bg-white/60">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{language === 'sk' ? 'Správa služieb' : 'Service Management'}</CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingService(null); setFormData(defaultFormData); }}>
              <Plus className="w-4 h-4 mr-2" />
              {language === 'sk' ? 'Pridať službu' : 'Add Service'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingService
                  ? (language === 'sk' ? 'Upraviť službu' : 'Edit Service')
                  : (language === 'sk' ? 'Nová služba' : 'New Service')}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {language === 'sk' 
                  ? 'Formulár na pridanie alebo úpravu služieb' 
                  : 'Form to add or edit services'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'sk' ? 'Názov (SK)' : 'Name (SK)'}</Label>
                  <Input
                    value={formData.name_sk}
                    onChange={(e) => setFormData({ ...formData, name_sk: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'sk' ? 'Názov (EN)' : 'Name (EN)'}</Label>
                  <Input
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'sk' ? 'Popis (SK)' : 'Description (SK)'}</Label>
                  <Textarea
                    value={formData.description_sk}
                    onChange={(e) => setFormData({ ...formData, description_sk: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'sk' ? 'Popis (EN)' : 'Description (EN)'}</Label>
                  <Textarea
                    value={formData.description_en}
                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'sk' ? 'Trvanie (min)' : 'Duration (min)'}</Label>
                  <Input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                    min={5}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'sk' ? 'Cena (€)' : 'Price (€)'}</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    min={0}
                    step={0.01}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'sk' ? 'Poradie' : 'Sort Order'}</Label>
                  <Input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'sk' ? 'Kategória' : 'Category'}</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chiropractic">
                        {language === 'sk' ? 'Chiropraxia' : 'Chiropractic'}
                      </SelectItem>
                      <SelectItem value="physiotherapy">
                        {language === 'sk' ? 'Fyzioterapia' : 'Physiotherapy'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{language === 'sk' ? 'Ikona' : 'Icon'}</Label>
                  <Select
                    value={formData.icon}
                    onValueChange={(value) => setFormData({ ...formData, icon: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((icon) => (
                        <SelectItem key={icon} value={icon}>
                          {icon}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>{language === 'sk' ? 'Aktívna' : 'Active'}</Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  {language === 'sk' ? 'Zrušiť' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingService
                    ? (language === 'sk' ? 'Uložiť' : 'Save')
                    : (language === 'sk' ? 'Vytvoriť' : 'Create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        <div className="rounded-[22px] border border-[var(--glass-border-subtle)] bg-white/40 overflow-hidden shadow-sm">
          <div className="overflow-x-auto min-w-full">
            <Table>
              <TableHeader className="bg-white/60 backdrop-blur-sm border-b border-[var(--glass-border-subtle)]">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-[hsl(var(--soft-navy))] py-4">{language === 'sk' ? 'Služba' : 'Service'}</TableHead>
                  <TableHead className="font-semibold text-[hsl(var(--soft-navy))] hidden sm:table-cell">{language === 'sk' ? 'Trvanie' : 'Duration'}</TableHead>
                  <TableHead className="font-semibold text-[hsl(var(--soft-navy))]">{language === 'sk' ? 'Cena' : 'Price'}</TableHead>
                  <TableHead className="font-semibold text-[hsl(var(--soft-navy))] hidden md:table-cell">{language === 'sk' ? 'Kategória' : 'Category'}</TableHead>
                  <TableHead className="font-semibold text-[hsl(var(--soft-navy))]">{language === 'sk' ? 'Stav' : 'Status'}</TableHead>
                  <TableHead className="text-right font-semibold text-[hsl(var(--soft-navy))]">{language === 'sk' ? 'Akcie' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services?.map((service) => (
                  <TableRow key={service.id} className="group hover:bg-white/50 transition-colors border-b border-[var(--glass-border-subtle)] last:border-0">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-primary/5 text-primary border border-primary/10 shadow-sm sm:h-10 sm:w-10">
                          {(() => {
                            const IconComponent = ICON_MAP[service.icon as keyof typeof ICON_MAP] || Activity;
                            return <IconComponent className="w-5 h-5 group-hover:scale-110 transition-transform" />;
                          })()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-[hsl(var(--deep-navy))] text-sm sm:text-base">
                            {language === 'sk' ? service.name_sk : service.name_en}
                          </span>
                          <span className="sm:hidden text-[10px] text-muted-foreground font-medium">
                            {service.duration} min • {service.price}€
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell font-medium text-slate-600">
                      {service.duration} min
                    </TableCell>
                    <TableCell className="font-bold text-[hsl(var(--soft-navy))]">
                      {service.price}€
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "rounded-[10px] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-transparent",
                          service.category === 'chiropractic' 
                            ? "bg-blue-500/10 text-blue-600 border-blue-500/20" 
                            : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        )}
                      >
                        {service.category === 'chiropractic'
                          ? (language === 'sk' ? 'Chiropraxia' : 'Chiropractic')
                          : (language === 'sk' ? 'Fyzioterapia' : 'Physiotherapy')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={service.is_active ? "outline" : "destructive"} 
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[9px] sm:text-[10px]",
                          service.is_active ? "bg-green-500/10 text-green-600 border-green-500/20" : ""
                        )}
                      >
                        {service.is_active
                          ? (language === 'sk' ? 'Aktívna' : 'Active')
                          : (language === 'sk' ? 'Neaktívna' : 'Inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(service)}
                          className="h-8 w-8 rounded-lg hover:bg-primary/5 text-slate-400 hover:text-primary transition-colors"
                          aria-label={language === 'sk' ? 'Upraviť' : 'Edit'}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(service.id)}
                          className="h-8 w-8 rounded-lg hover:bg-destructive/5 text-slate-400 hover:text-destructive transition-colors"
                          aria-label={language === 'sk' ? 'Odstrániť' : 'Delete'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {services?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16 text-muted-foreground italic">
                      {language === 'sk' ? 'Žiadne služby' : 'No services'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceManagement;
