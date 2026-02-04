import { Check } from 'lucide-react';
import { BookingStep } from '@/types/booking';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/i18n/LanguageContext';

interface ProgressBarProps {
  steps: BookingStep[];
  currentStep: number;
}

const ProgressBar = ({ steps, currentStep }: ProgressBarProps) => {
  const { t } = useLanguage();

  return (
    <div className="w-full">
      {/* Desktop Progress */}
      <div className="hidden sm:block">
        <div className="glass-card rounded-2xl p-4 md:p-5">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  {/* Step Circle & Label */}
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-400",
                        isCompleted && "bg-primary text-primary-foreground shadow-sm",
                        isCurrent && "bg-navy text-navy-foreground shadow-lg ring-4 ring-navy/15 animate-pulse-soft",
                        !isCompleted && !isCurrent && "bg-muted/60 text-muted-foreground"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="w-4 h-4 md:w-5 md:h-5" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <div className="mt-2.5 text-center">
                      <p className={cn(
                        "text-xs md:text-sm font-medium transition-colors duration-200",
                        (isCompleted || isCurrent) ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {step.title}
                      </p>
                    </div>
                  </div>
                  
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="flex-1 mx-3 md:mx-5">
                      <div className="relative h-0.5 rounded-full bg-muted/60 overflow-hidden">
                        <div
                          className={cn(
                            "absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-600 ease-out",
                            isCompleted ? "w-full" : "w-0"
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Mobile Progress */}
      <div className="sm:hidden">
        <div className="glass-card rounded-xl p-3.5">
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2.5 mb-2.5">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "rounded-full transition-all duration-300",
                  index === currentStep 
                    ? "w-7 h-1.5 bg-navy" 
                    : index < currentStep 
                      ? "w-1.5 h-1.5 bg-primary" 
                      : "w-1.5 h-1.5 bg-muted-foreground/20"
                )}
              />
            ))}
          </div>
          
          {/* Current step info */}
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">
              {steps[currentStep]?.title}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {t.stepOf.replace('{current}', String(currentStep + 1)).replace('{total}', String(steps.length))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
