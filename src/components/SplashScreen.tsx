import React, { useState, useEffect, useCallback } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

const splashStyles: React.CSSProperties = {
  background:
    'radial-gradient(circle at top left, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0) 36%), linear-gradient(180deg, #BFE2FF 0%, #EAF6FF 100%)',
};

const progressBarBgStyle: React.CSSProperties = {
  backgroundColor: 'rgba(36, 71, 107, 0.12)',
};

const progressBarStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #24476B 0%, #4F95D5 100%)',
  width: '0%',
  transition: 'width 0.64s ease-in-out',
};

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isFading, setIsFading] = useState(false);
  const [animate, setAnimate] = useState(false);
  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    // Trigger progress animation on next frame
    requestAnimationFrame(() => setAnimate(true));

    const fadeTimer = setTimeout(() => setIsFading(true), 320);
    const completeTimer = setTimeout(() => handleComplete(), 640);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [handleComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-400 ease-in-out ${
        isFading ? 'opacity-0' : 'opacity-100'
      }`}
      style={splashStyles}
    >
      <div className="relative z-10 flex flex-col items-center gap-4 rounded-[28px] px-8 py-7 glass-soft">
        <h1 className="text-4xl font-heading font-semibold text-[hsl(211,48%,29%)] tracking-[0.2em]">
          FYZIO&FIT
        </h1>
        <div className="w-48 h-1 rounded-full overflow-hidden" style={progressBarBgStyle}>
          <div
            className="h-full rounded-full"
            style={{
              ...progressBarStyle,
              width: animate ? '100%' : '0%',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
