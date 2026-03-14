import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const SectionHeader = ({
  number,
  title,
  completed,
}: {
  number: number;
  title: string;
  completed: boolean;
}) => (
  <div className="flex items-center gap-2">
    <motion.div
      animate={completed ? { scale: [1, 1.2, 1], backgroundColor: 'rgba(255,255,255,1)' } : {}}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0",
        completed
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-primary/10 text-primary border border-primary/20"
      )}
    >
      <AnimatePresence mode="wait">
        {completed ? (
          <motion.span
            key="check"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
          </motion.span>
        ) : (
          <motion.span
            key="number"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.2 }}
          >
            {number}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
    <span className="text-sm font-semibold text-foreground">{title}</span>
  </div>
);

export default SectionHeader;
