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
      {/* Desktop */}
      <div className="hidden sm:block">
        <div className="border-b border-border/40 pb-4">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => {
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center min-w-[80px] md:min-w-[100px]">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200",
                      isCompleted && "bg-primary text-primary-foreground",
                      isCurrent && "bg-primary text-primary-foreground ring-2 ring-primary/20 ring-offset-2",
                      !isCompleted && !isCurrent && "bg-muted text-muted-foreground border border-border/60"
                    )}>
                      {isCompleted ? (
                        <Check className="w-4 h-4" strokeWidth={2.5} />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <p className={cn(
                      "mt-2 text-xs font-medium transition-colors duration-200",
                      isCompleted && "text-primary",
                      isCurrent && "text-foreground",
                      !isCompleted && !isCurrent && "text-muted-foreground"
                    )}>
                      {step.title}
                    </p>
                  </div>

                  {index < steps.length - 1 && (
                    <div className="w-12 md:w-20 mx-2 md:mx-4">
                      <div className="h-px bg-border/60 relative">
                        <div className={cn(
                          "absolute inset-y-0 left-0 bg-primary transition-all duration-300",
                          isCompleted ? "w-full" : "w-0"
                        )} style={{ height: '1px' }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="sm:hidden">
        <div className="border-b border-border/40 pb-3">
          <div className="flex items-center justify-center gap-2.5">
            {steps.map((step, index) => {
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;

              return (
                <div key={step.id} className="flex items-center">
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200",
                    isCompleted && "bg-primary text-primary-foreground",
                    isCurrent && "bg-primary text-primary-foreground ring-2 ring-primary/20 ring-offset-1",
                    !isCompleted && !isCurrent && "bg-muted text-muted-foreground border border-border/60"
                  )}>
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>

                  {index < steps.length - 1 && (
                    <div className="w-6 mx-1">
                      <div className="h-px bg-border/60 relative">
                        <div className={cn(
                          "absolute inset-y-0 left-0 bg-primary transition-all duration-300",
                          isCompleted ? "w-full" : "w-0"
                        )} style={{ height: '1px' }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center mt-2">
            <p className="text-xs font-semibold text-foreground">{steps[currentStep]?.title}</p>
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
