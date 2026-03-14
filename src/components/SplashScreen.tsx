import React, { useState, useEffect, useRef, useCallback } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFading, setIsFading] = useState(false);

  const stableOnComplete = useCallback(onComplete, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Dark background matching design system
      ctx.fillStyle = 'hsl(215, 25%, 10%)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      ctx.save();
      ctx.translate(centerX, centerY);

      const numLines = 80;
      const numPoints = 200;

      for (let i = 0; i < numLines; i++) {
        const linePhase = (i / numLines) * Math.PI * 2;

        ctx.strokeStyle = `rgba(255, 255, 255, ${0.04 + Math.sin(linePhase + time) * 0.02})`;
        ctx.lineWidth = 1;

        // Left side
        ctx.beginPath();
        for (let j = 0; j <= numPoints; j++) {
          const pointPhase = j / numPoints;
          const y = (pointPhase * 2 - 1) * (canvas.height / 2.5);
          const envelope = Math.sin(pointPhase * Math.PI);
          const wave1 = Math.sin(time + linePhase) * 60;
          const wave2 = Math.sin(pointPhase * 8 + time * 2) * 40;
          const centerComplexity = Math.pow(Math.cos(pointPhase * Math.PI - Math.PI / 2), 2) * 100;
          const wave3 = Math.cos(linePhase * 4 - time) * centerComplexity;
          const x = envelope * (wave1 + wave2 + wave3 + 60);

          if (j === 0) ctx.moveTo(-x, y);
          else ctx.lineTo(-x, y);
        }
        ctx.stroke();

        // Right side (mirror)
        ctx.beginPath();
        for (let j = 0; j <= numPoints; j++) {
          const pointPhase = j / numPoints;
          const y = (pointPhase * 2 - 1) * (canvas.height / 2.5);
          const envelope = Math.sin(pointPhase * Math.PI);
          const wave1 = Math.sin(time + linePhase) * 60;
          const wave2 = Math.sin(pointPhase * 8 + time * 2) * 40;
          const centerComplexity = Math.pow(Math.cos(pointPhase * Math.PI - Math.PI / 2), 2) * 100;
          const wave3 = Math.cos(linePhase * 4 - time) * centerComplexity;
          const x = envelope * (wave1 + wave2 + wave3 + 60);

          if (j === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      ctx.restore();

      time += 0.008;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const fadeTimer = setTimeout(() => setIsFading(true), 800);
    const completeTimer = setTimeout(() => stableOnComplete(), 1300);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [stableOnComplete]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-500 ease-in-out ${
        isFading ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ backgroundColor: 'hsl(215, 25%, 10%)' }}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="relative z-10 flex flex-col items-center gap-4">
        <h1 className="text-4xl font-heading font-semibold text-white tracking-[0.2em] drop-shadow-lg">
          FYZIO&FIT
        </h1>
        <div className="w-48 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
          <div
            className="h-full rounded-full"
            style={{
              backgroundColor: 'hsl(210, 70%, 55%)',
              animation: 'splash-progress 2.5s ease-in-out forwards',
            }}
          />
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes splash-progress {
          0% { transform: scaleX(0); transform-origin: left; }
          100% { transform: scaleX(1); transform-origin: left; }
        }
        @keyframes splash-progress {
          0% { width: 0; }
          100% { width: 100%; }
        }
      `}} />
    </div>
  );
};

export default SplashScreen;
