import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface SubmitButtonProps {
  enabled: boolean;
  isPending: boolean;
  onSubmit: () => void;
}

const SubmitButton = ({ enabled, isPending, onSubmit }: SubmitButtonProps) => {
  const { language } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0.3, y: 12 }}
      animate={{
        opacity: enabled ? 1 : 0.3,
        y: enabled ? 0 : 12,
        scale: enabled ? 1 : 0.98,
      }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn("pb-4 sm:pb-6", !enabled && "pointer-events-none")}
    >
      <Button
        variant="default"
        size="lg"
        data-testid="submit-booking"
        onClick={onSubmit}
        disabled={!enabled || isPending}
        className={cn(
          "w-full h-12 gap-2 text-sm font-semibold",
          enabled ? "lg-btn-aurora" : "bg-slate-200 text-slate-500 cursor-not-allowed opacity-50"
        )}
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{language === 'sk' ? 'Rezervujem...' : 'Booking...'}</span>
          </>
        ) : (
          <span>{language === 'sk' ? 'Rezervovať' : 'Book now'}</span>
        )}
      </Button>
    </motion.div>
  );
};

export default SubmitButton;
