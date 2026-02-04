import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const ThemeToggle = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="w-9 h-9 rounded-xl bg-muted/50"
        disabled
      >
        <div className="w-4 h-4" />
      </Button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        "relative w-9 h-9 rounded-xl overflow-hidden transition-all duration-300",
        "bg-muted/50 hover:bg-muted",
        "group"
      )}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Background glow effect */}
      <div className={cn(
        "absolute inset-0 transition-opacity duration-500",
        isDark 
          ? "bg-gradient-to-br from-primary/20 to-accent/20 opacity-100" 
          : "bg-gradient-to-br from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100"
      )} />
      
      {/* Sun icon */}
      <Sun className={cn(
        "absolute h-4 w-4 transition-all duration-500 ease-out",
        isDark 
          ? "rotate-90 scale-0 opacity-0" 
          : "rotate-0 scale-100 opacity-100 text-primary"
      )} />
      
      {/* Moon icon */}
      <Moon className={cn(
        "absolute h-4 w-4 transition-all duration-500 ease-out",
        isDark 
          ? "rotate-0 scale-100 opacity-100 text-primary" 
          : "-rotate-90 scale-0 opacity-0"
      )} />
    </Button>
  );
};

export default ThemeToggle;
