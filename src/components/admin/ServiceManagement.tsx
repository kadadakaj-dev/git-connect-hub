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
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

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
      <CardContent>
        <div className="rounded-[16px] border border-[var(--glass-border-subtle)] overflow-x-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm">
            <TableRow>
              <TableHead>{language === 'sk' ? 'Názov' : 'Name'}</TableHead>
              <TableHead>{language === 'sk' ? 'Trvanie' : 'Duration'}</TableHead>
              <TableHead>{language === 'sk' ? 'Cena' : 'Price'}</TableHead>
              <TableHead>{language === 'sk' ? 'Kategória' : 'Category'}</TableHead>
              <TableHead>{language === 'sk' ? 'Stav' : 'Status'}</TableHead>
              <TableHead className="text-right">{language === 'sk' ? 'Akcie' : 'Actions'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services?.map((service) => (
              <TableRow key={service.id} className="even:bg-muted/20">
                <TableCell className="font-medium">
                  {language === 'sk' ? service.name_sk : service.name_en}
                </TableCell>
                <TableCell>{service.duration} min</TableCell>
                <TableCell>{service.price}€</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    service.category === 'chiropractic'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-accent text-accent-foreground'
                  }`}>
                    {service.category === 'chiropractic'
                      ? (language === 'sk' ? 'Chiropraxia' : 'Chiropractic')
                      : (language === 'sk' ? 'Fyzioterapia' : 'Physiotherapy')}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    service.is_active
                      ? 'bg-green-500/10 text-green-600'
                      : 'bg-red-500/10 text-red-600'
                  }`}>
                    {service.is_active
                      ? (language === 'sk' ? 'Aktívna' : 'Active')
                      : (language === 'sk' ? 'Neaktívna' : 'Inactive')}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(service)}
                      aria-label={language === 'sk' ? 'Upraviť' : 'Edit'}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(service.id)}
                      className="text-destructive hover:text-destructive"
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
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {language === 'sk' ? 'Žiadne služby' : 'No services'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceManagement;
