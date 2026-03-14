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
      className={cn("pb-6", !enabled && "pointer-events-none")}
    >
      <Button
        variant="default"
        size="lg"
        onClick={onSubmit}
        disabled={!enabled || isPending}
        className="w-full gap-2 rounded-2xl text-sm font-semibold h-12 shadow-[0_4px_24px_rgba(59,130,246,0.3)] bg-primary hover:bg-primary/90 text-primary-foreground border-0 hover:-translate-y-0.5 transition-all duration-300 ease-liquid active:scale-[0.98]"
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
