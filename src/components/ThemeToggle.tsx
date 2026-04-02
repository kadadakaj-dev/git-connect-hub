import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const ThemeToggle = () => {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-14 h-8 rounded-full bg-muted/50 animate-pulse" />
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        "relative w-14 h-8 rounded-full transition-all duration-300",
        "bg-muted border border-border",
        "hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "outline-none"
      )}
      aria-label={isDark ? 'Prepnúť na svetlý režim' : 'Prepnúť na tmavý režim'}
    >
      {/* Track background */}
      <div className={cn(
        "absolute inset-0 rounded-full transition-colors duration-300",
        isDark ? "bg-primary/10" : "bg-primary/5"
      )} />
      
      {/* Sliding thumb */}
      <div className={cn(
        "absolute top-1 w-6 h-6 rounded-full transition-all duration-300 ease-out",
        "bg-background shadow-md border border-border/50",
        "flex items-center justify-center",
        isDark ? "left-7" : "left-1"
      )}>
        <Sun className={cn(
          "absolute h-3.5 w-3.5 text-primary transition-all duration-300",
          isDark ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"
        )} />
        <Moon className={cn(
          "absolute h-3.5 w-3.5 text-primary transition-all duration-300",
          isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
        )} />
      </div>
    </button>
  );
};

export default ThemeToggle;
