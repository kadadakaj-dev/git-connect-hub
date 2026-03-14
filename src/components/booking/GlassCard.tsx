import { cn } from '@/lib/utils';

const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn(
    "backdrop-blur-xl rounded-2xl p-4 relative overflow-hidden",
    "bg-[var(--glass-white)] border border-[var(--glass-border)] shadow-glass",
    "before:absolute before:inset-0 before:bg-[var(--reflection-top)] before:pointer-events-none before:rounded-[inherit] before:z-[1]",
    className
  )}>
    <div className="relative z-[2]">{children}</div>
  </div>
);

export default GlassCard;
