import { Service } from '@/types/booking';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';
import { 
  ClipboardCheck, 
  Activity, 
  Bone, 
  Dumbbell, 
  Hand, 
  MessageSquare,
  Clock,
  DollarSign
} from 'lucide-react';

interface ServiceSelectionProps {
  selectedService: Service | null;
  onSelect: (service: Service) => void;
}

const iconMap: Record<string, React.ElementType> = {
  ClipboardCheck,
  Activity,
  Bone,
  Dumbbell,
  Hand,
  MessageSquare,
};

const serviceKeyMap: Record<string, keyof typeof import('@/i18n/translations').translations.sk.services> = {
  '1': 'initialExamination',
  '2': 'physiotherapySession',
  '3': 'chiropracticAdjustment',
  '4': 'sportsTherapy',
  '5': 'massageTherapy',
  '6': 'followUpConsultation',
};

// Base service data without translations
const baseServices: Omit<Service, 'name' | 'description'>[] = [
  { id: '1', duration: 60, price: 120, category: 'physiotherapy', icon: 'ClipboardCheck' },
  { id: '2', duration: 45, price: 85, category: 'physiotherapy', icon: 'Activity' },
  { id: '3', duration: 30, price: 75, category: 'chiropractic', icon: 'Bone' },
  { id: '4', duration: 50, price: 95, category: 'physiotherapy', icon: 'Dumbbell' },
  { id: '5', duration: 60, price: 90, category: 'physiotherapy', icon: 'Hand' },
  { id: '6', duration: 30, price: 60, category: 'physiotherapy', icon: 'MessageSquare' },
];

const ServiceSelection = ({ selectedService, onSelect }: ServiceSelectionProps) => {
  const { t } = useLanguage();

  const services: Service[] = baseServices.map(service => {
    const key = serviceKeyMap[service.id];
    return {
      ...service,
      name: t.services[key].name,
      description: t.services[key].description,
    };
  });

  return (
    <div className="animate-fade-in-up">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          {t.selectService}
        </h2>
        <p className="text-muted-foreground">
          {t.chooseServiceSubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        {services.map((service) => {
          const Icon = iconMap[service.icon] || Activity;
          const isSelected = selectedService?.id === service.id;

          return (
            <button
              key={service.id}
              onClick={() => onSelect(service)}
              className={cn(
                "relative p-6 rounded-xl text-left transition-all duration-300 group",
                "border-2 hover:shadow-elegant",
                isSelected
                  ? "border-primary bg-primary/5 shadow-glow"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              {/* Category Badge */}
              <span className={cn(
                "inline-block px-2 py-1 text-xs font-medium rounded-full mb-3",
                service.category === 'physiotherapy' 
                  ? "bg-primary/10 text-primary" 
                  : "bg-accent text-accent-foreground"
              )}>
                {service.category === 'physiotherapy' ? t.categories.physiotherapy : t.categories.chiropractic}
              </span>

              {/* Icon */}
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors",
                isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
              )}>
                <Icon className="w-6 h-6" />
              </div>

              {/* Service Info */}
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {service.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {service.description}
              </p>

              {/* Duration & Price */}
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {service.duration} {t.min}
                </span>
                <span className="flex items-center gap-1 font-semibold text-foreground">
                  <DollarSign className="w-4 h-4" />
                  {service.price}
                </span>
              </div>

              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ServiceSelection;
