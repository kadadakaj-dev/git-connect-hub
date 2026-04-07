import { Service } from '@/types/booking';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';
import { useServices } from '@/hooks/useServices';
import ServiceSkeleton from './ServiceSkeleton';
import { 
  Phone, 
  Activity, 
  Bone, 
  Hand, 
  ClipboardCheck, 
  Dumbbell, 
  MessageSquare,
  Stethoscope
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Activity,
  Bone,
  Hand,
  ClipboardCheck,
  Dumbbell,
  MessageSquare,
  Stethoscope
};

interface ServiceSelectionProps {
  selectedService: Service | null;
  onSelect: (service: Service) => void;
}

const EXPRESS_SERVICE_ID = 'b15733f3-274d-497b-8074-dca4d0daf6a3';
const EXPRESS_PHONE = '+421 905 307 198';

const ServiceSelection = ({ selectedService, onSelect }: ServiceSelectionProps) => {
  const { t, language } = useLanguage();
  const { data: services, isLoading, error } = useServices();

  if (isLoading) {
    return <ServiceSkeleton />;
  }

  if (error || !services || services.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground text-sm">
          {language === 'sk' ? 'Služby nie sú momentálne dostupné' : 'Services are not available at the moment'}
        </p>
      </div>
    );
  }

  // Group services by category
  const groupedServices = services.reduce((acc, service) => {
    const cat = service.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const categoryLabels: Record<string, { sk: string; en: string }> = {
    physiotherapy: { sk: 'Fyzioterapia', en: 'Physiotherapy' },
    chiropractic: { sk: 'Chiropraxia', en: 'Chiropractic' },
    other: { sk: 'Ostatné', en: 'Other' }
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedServices).map(([category, items]) => (
        <div key={category} className="space-y-2">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 px-1">
            {language === 'sk' ? categoryLabels[category]?.sk : categoryLabels[category]?.en}
          </h3>
          <div className="space-y-1.5">
            {items.map((service) => {
              const isSelected = selectedService?.id === service.id;
              const isExpress = service.id === EXPRESS_SERVICE_ID;

              if (isExpress) {
                return (
                  <a
                    key={service.id}
                    href={`tel:${EXPRESS_PHONE.replace(/\s/g, '')}`}
                    className={cn(
                      "block rounded-2xl relative overflow-hidden",
                      "hover:-translate-y-1 hover:shadow-glass-float transition-all duration-300 ease-liquid",
                      "group cursor-pointer border-2 border-primary/30"
                    )}
                  >
                    <div className="relative z-[1] h-full rounded-[14px] overflow-hidden bg-[var(--glass-white)] backdrop-blur-xl p-3.5">
                      <div className="absolute inset-0 bg-[var(--reflection-top)] pointer-events-none" />
                      
                      <div className="relative z-[2] flex flex-col h-full justify-between gap-3">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                            ⚡ {t.expressLabel}
                          </span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black font-data text-[hsl(var(--deep-navy))]">15 €</span>
                            <span className="text-[9px] text-muted-foreground font-bold uppercase">{t.expressSurcharge}</span>
                          </div>
                        </div>

                        <div className="text-center">
                          <p className="text-sm font-semibold text-[hsl(var(--soft-navy))]">
                            {service.description} (30min)
                          </p>
                          <p className="text-[11px] font-bold text-primary/80 italic">
                            {language === 'sk' ? 'Len telefonicky' : 'By phone only'}
                          </p>
                        </div>

                        <div className={cn(
                          "flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl",
                          "backdrop-blur-xl bg-primary/5 border border-primary/10 shadow-sm",
                          "group-hover:bg-primary/10 transition-all duration-300"
                        )}>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Phone className="w-3.5 h-3.5 text-primary" />
                            <span className="text-[9px] font-bold uppercase tracking-tight text-primary">
                              {language === 'sk' ? 'Rezervovať' : 'Book'}
                            </span>
                          </div>
                          <span className="text-lg font-bold font-data text-[hsl(var(--deep-navy))]">
                            {EXPRESS_PHONE}
                          </span>
                        </div>
                      </div>
                    </div>
                  </a>
                );
              }

              return (
                <button
                  key={service.id}
                  data-testid={`service-${service.id}`}
                  onClick={() => onSelect(service)}
                  aria-pressed={isSelected}
                  className={cn(
                    "w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left",
                    "transition-all duration-300 ease-liquid",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    "border backdrop-blur-sm",
                    isSelected
                      ? "border-primary bg-primary/8 shadow-[0_0_16px_rgba(59,130,246,0.12)] -translate-y-0.5"
                      : "border-[var(--glass-border-subtle)] bg-[var(--glass-white)] hover:border-[var(--glass-border)] hover:bg-[var(--glass-white-md)] hover:-translate-y-0.5 hover:shadow-glass"
                  )}
                >
                  {/* Radio indicator */}
                  <div className="mt-1 flex-shrink-0">
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-300 ease-liquid",
                      isSelected
                        ? "border-primary shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                        : "border-muted-foreground/30"
                    )}>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-primary animate-scale-in" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const IconComponent = ICON_MAP[service.icon as keyof typeof ICON_MAP] || Activity;
                        return <IconComponent className={cn("w-3.5 h-3.5", isSelected ? "text-primary" : "text-muted-foreground/70")} />;
                      })()}
                      <p className="text-sm font-medium text-foreground leading-snug">
                        {service.name}
                      </p>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                      {service.description} ({service.duration}{t.min})
                    </p>
                  </div>

                  <span className={cn(
                    "text-sm font-bold font-data whitespace-nowrap mt-0.5 transition-colors duration-200",
                    isSelected ? "text-primary" : "text-foreground"
                  )}>
                    {service.price} €
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ServiceSelection;
