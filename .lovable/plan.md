```typescript
import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Activity, User, Home, WifiOff, Download, ChevronRight, Phone } from 'lucide-react';

// --- ČASŤ 1: SPLASH SCREEN KOMPONENT (Canvas Animácia) ---
const SplashScreen = ({ onComplete }) => {
  const canvasRef = useRef(null);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let time = 0;

    // Generatívna animácia 80 vlniacich sa čiar
    const render = () => {
      // Prispôsobenie veľkosti canvasu oknu
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Tmavé pozadie
      ctx.fillStyle = '#0f172a'; // Tailwind slate-900
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Štýl čiar
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.5;

      const numLines = 80;
      const spacing = canvas.width / numLines;

      for (let i = 0; i < numLines; i++) {
        ctx.beginPath();
        let x = i * spacing;
        for (let y = 0; y < canvas.height; y += 20) {
          // Výpočet sínusoidného posunu
          const xOffset = Math.sin((y * 0.005) + time + (i * 0.05)) * 60;
          
          if (y === 0) {
            ctx.moveTo(x + xOffset, y);
          } else {
            ctx.lineTo(x + xOffset, y);
          }
        }
        ctx.stroke();
      }

      time += 0.015; // Rýchlosť vlnenia
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Logika zobrazenia na 2.5 sekundy + 500ms fade out
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 2500);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3000); // 2500ms zobrazenie + 500ms animácia zmiznutia

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900 transition-opacity duration-500 ease-in-out ${isFading ? 'opacity-0' : 'opacity-100'}`}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo zjavenie počas splash screenu */}
        <h1 className="text-4xl font-bold text-white tracking-widest mb-4 drop-shadow-lg">FYZIO&FIT</h1>
        <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 w-full origin-left animate-[scale-x_2.5s_ease-in-out]"></div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scale-x {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
      `}} />
    </div>
  );
};

// --- ČASŤ 2: HLAVNÁ APLIKÁCIA (PWA Simulácia a UI) ---
export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // Inicializácia: Kontrola sessionStorage a Offline stavu
  useEffect(() => {
    // Session Storage check pre Splash Screen
    const splashShown = sessionStorage.getItem('fyzio_splash_shown');
    if (splashShown) {
      setShowSplash(false);
    }

    // Simulácia PWA Install Banneru (zobrazí sa po chvíli)
    const installTimer = setTimeout(() => {
      setShowInstallPrompt(true);
    }, 5000);

    // Offline detekcia (Z bodu 1 z tvojho ďalšieho promptu)
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(installTimer);
    };
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    sessionStorage.setItem('fyzio_splash_shown', 'true');
  };

  const resetSession = () => {
    sessionStorage.removeItem('fyzio_splash_shown');
    window.location.reload();
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20 md:pb-0">
      
      {/* PWA: Offline Banner */}
      {isOffline && (
        <div className="bg-red-500 text-white p-3 flex items-center justify-center gap-2 text-sm font-medium sticky top-0 z-40 shadow-md">
          <WifiOff size={18} />
          <span>Ste offline. Niektoré funkcie (napr. nová rezervácia) môžu byť obmedzené.</span>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30 pt-safe">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-900">FYZIO&FIT</h1>
          <button className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <User size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto p-4 space-y-6">
        
        {/* Hero / CTA */}
        <section className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">Pripravený na tréning?</h2>
            <p className="text-blue-100 mb-6 text-sm">Zarezervujte si svoj ďalší termín fyzioterapie alebo tréningu už dnes.</p>
            <button className="bg-white text-blue-700 font-bold py-3 px-6 rounded-xl w-full shadow-md flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors">
              <Calendar size={20} />
              Nová rezervácia
            </button>
          </div>
          {/* Dekoratívne kruhy v pozadí */}
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10"></div>
          <div className="absolute bottom-0 right-10 -mb-10 w-24 h-24 rounded-full bg-white opacity-10"></div>
        </section>

        {/* PWA: Simulácia App Shortcuts (Z bodu 4 tvojho promptu) */}
        <section>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">Rýchly prístup</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center gap-2 hover:bg-slate-50 transition-colors">
              <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                <Activity size={24} />
              </div>
              <span className="text-sm font-medium">Moje plány</span>
            </button>
            <button className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center gap-2 hover:bg-slate-50 transition-colors">
              <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                <Phone size={24} />
              </div>
              <span className="text-sm font-medium">Kontakt</span>
            </button>
          </div>
        </section>

        {/* Nadchádzajúci termín */}
        <section>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">Nadchádzajúci termín</h3>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-slate-100 p-3 rounded-lg text-center min-w-[60px]">
                <div className="text-xs font-bold text-red-500">MÁJ</div>
                <div className="text-xl font-bold text-slate-800">24</div>
              </div>
              <div>
                <h4 className="font-bold text-slate-800">Komplexná fyzioterapia</h4>
                <p className="text-sm text-slate-500">14:00 - 15:00 • Dr. Kováč</p>
              </div>
            </div>
            <ChevronRight className="text-slate-400" size={20} />
          </div>
        </section>

        {/* PWA: Install Prompt (Z bodu 3 tvojho promptu) */}
        {showInstallPrompt && !isOffline && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-4 animate-in slide-in-from-bottom-4 duration-500 shadow-sm relative overflow-hidden">
            <div className="bg-blue-600 text-white p-2 rounded-lg shrink-0">
              <Download size={24} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-blue-900 text-sm mb-1">Pridať aplikáciu na plochu</h4>
              <p className="text-xs text-blue-700 mb-3">Nainštalujte si FYZIO&FIT pre rýchlejší prístup a offline funkcie.</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowInstallPrompt(false)}
                  className="bg-blue-600 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-blue-700 transition"
                >
                  Nainštalovať
                </button>
                <button 
                  onClick={() => setShowInstallPrompt(false)}
                  className="bg-transparent text-blue-600 text-xs font-bold py-2 px-4 rounded-lg hover:bg-blue-100 transition"
                >
                  Neskôr
                </button>
              </div>
            </div>
            <button 
              onClick={() => setShowInstallPrompt(false)}
              className="absolute top-2 right-2 text-blue-400 hover:text-blue-600"
            >
              &times;
            </button>
          </div>
        )}

        {/* Tlačidlo len pre účely ukážky v Canvas (aby používateľ mohol znovu vidieť Splash) */}
        <div className="pt-8 border-t border-slate-200 mt-8">
          <p className="text-xs text-slate-400 text-center mb-2">Nástroje pre testovanie (len v ukážke)</p>
          <button 
            onClick={resetSession}
            className="w-full bg-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-300 transition"
          >
            Zmazať Session a reštartovať animáciu
          </button>
        </div>

      </main>

      {/* Spodná navigácia (Typická pre PWA na mobiloch) */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-slate-200 pb-safe z-30 md:hidden">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          <button className="flex flex-col items-center gap-1 text-blue-600">
            <Home size={24} />
            <span className="text-[10px] font-medium">Domov</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition">
            <Calendar size={24} />
            <span className="text-[10px] font-medium">Rezervácie</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition">
            <Activity size={24} />
            <span className="text-[10px] font-medium">Plány</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
```

Ahoj, do môjho rozpracovaného React projektu potrebujem integrovať úvodnú "Splash Screen" animáciu. Mám tu pripravený kód pre komponent SplashScreen (využíva Canvas a Math.sin pre generatívne vlny).

Prosím, integruj ho do môjho projektu nasledovne:

1. Vytvor/použi súbor pre SplashScreen a vlož do neho priložený kód komponentu.

2. Pozri sa na môj hlavný súbor (napr. App.jsx alebo vstupný bod aplikácie). Chcem, aby si obalil môj existujúci layout/router tak, že sa najprv zobrazí SplashScreen.

3. Použi logiku `sessionStorage.getItem('fyzio_splash_shown')` – animácia sa musí prehrať používateľovi iba raz počas jednej session.

4. Zachovaj všetky moje existujúce importy, routing a štruktúru aplikácie. Len pridaj podmienku `if (showSplash) return <SplashScreen onComplete={handleSplashComplete} />` a zabezpeč, aby sa po dokončení animácie plynule načítala moja skutočná aplikácia.

5. Ak tam vidíš aj kód pre PWA offline banner (WifiOff), pridaj túto detekciu siete aj do môjho globálneho layoutu, ak to tam ešte nemám.

Tu je kód Splash Screenu, z ktorého vychádzaj:

&nbsp;