import React, { useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

/* ── timing constants (seconds) ── */
const LETTERS = 'FYZIO&FIT'.split('');
const LETTER_STAGGER = 0.08;
const GLOW_START = LETTERS.length * LETTER_STAGGER;     // ~0.72 s
const FADE_START = 2.4;                                 // begin exit fade
const TOTAL_DURATION = 3000;                            // ms – fires onComplete

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const prefersReduced = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    const duration = prefersReduced ? 1200 : TOTAL_DURATION;
    const timer = setTimeout(handleComplete, duration);
    return () => clearTimeout(timer);
  }, [handleComplete, prefersReduced]);

  /* ── reduced-motion: static text, quick fade ── */
  if (prefersReduced) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-b from-[#BFE2FF] to-[#EAF6FF]"
        role="status"
        aria-label="Loading FYZIO&FIT"
      >
        <h1 className="text-4xl font-heading font-semibold text-[hsl(211,48%,29%)] tracking-[0.2em]">
          FYZIO&FIT
        </h1>
      </div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-b from-[#BFE2FF] to-[#EAF6FF]"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      role="status"
      aria-label="Loading FYZIO&FIT"
    >
      {/* ── content wrapper (no scale/breathing — CLS safe) ── */}
      <div className="flex flex-col items-center gap-6">
        {/* ── letter-by-letter reveal (opacity only, no y transform) ── */}
        <h1
          className="text-4xl font-heading font-semibold text-[hsl(211,48%,29%)] tracking-[0.2em] flex"
          aria-hidden="true"
        >
          {LETTERS.map((char, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                delay: i * LETTER_STAGGER,
                duration: 0.35,
                ease: 'easeOut',
              }}
            >
              {char}
            </motion.span>
          ))}
        </h1>

        {/* ── glow line ── */}
        <motion.div
          className="h-[2px] rounded-full"
          style={{
            background:
              'linear-gradient(90deg, transparent, hsl(211,48%,29%) 30%, hsl(207,56%,58%) 70%, transparent)',
          }}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 192, opacity: 1 }}
          transition={{
            delay: GLOW_START,
            duration: 0.5,
            ease: 'easeOut',
          }}
        />

        {/* ── progress dot on track ── */}
        <div className="relative w-48 h-[2px] rounded-full bg-[hsl(211,48%,29%)]/10 overflow-hidden">
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[hsl(211,48%,29%)]"
            initial={{ left: 0 }}
            animate={{ left: '100%' }}
            transition={{
              delay: GLOW_START + 0.5,
              duration: FADE_START - GLOW_START - 0.5,
              ease: 'linear',
            }}
          />
        </div>
      </div>

      {/* ── fade-out overlay ── */}
      <motion.div
        className="absolute inset-0 bg-white dark:bg-[hsl(211,48%,12%)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          delay: FADE_START,
          duration: 0.6,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
};

export default SplashScreen;
