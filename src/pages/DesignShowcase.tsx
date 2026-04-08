import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Layout, MousePointer2, Type } from 'lucide-react';

const DesignShowcase = () => {
  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-lg-color-brand-glow">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div 
          className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] rounded-full bg-lg-color-brand-blue/20 blur-[80px] animate-pulse"
          style={{ animationDuration: '15s' }}
        />
        <div 
          className="absolute bottom-[10%] right-[10%] w-[35vw] h-[35vw] rounded-full bg-lg-color-brand-sky/30 blur-[80px] animate-pulse"
          style={{ animationDuration: '20s', animationDelay: '2s' }}
        />
        <div 
          className="absolute top-[40%] left-[50%] w-[25vw] h-[25vw] rounded-full bg-lg-color-brand-blue-light/20 blur-[60px] animate-pulse"
          style={{ animationDuration: '25s', animationDelay: '5s' }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-20 max-w-5xl">
        <header className="mb-16 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-bold text-lg-color-brand-blue-dark mb-4 tracking-tight"
          >
            Liquid Glass Aqua
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-lg-color-text-slate max-w-2xl mx-auto"
          >
            Oficiálna testovacia stránka pre overenie dizajnových tokenov a vizuálnej konzistencie.
          </motion.p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* Card Section */}
          <section className="space-y-8">
            <div className="flex items-center gap-3 mb-6">
              <Layout className="w-6 h-6 text-lg-color-brand-blue" />
              <h2 className="text-2xl font-semibold text-lg-color-brand-blue-dark">Glass Cards</h2>
            </div>
            
            <div className="lg-glass-card p-8 min-h-[200px] flex flex-col justify-end">
              <span className="text-sm font-medium text-lg-color-brand-blue mb-2">Resting State</span>
              <h3 className="text-xl font-bold text-lg-color-text-ink">Statická Karta</h3>
              <p className="text-lg-color-text-slate mt-2">
                Základná karta so 16px rozostrením (blur) a 24px rádiusom.
              </p>
            </div>

            <div className="lg-glass-card--interactive p-8 min-h-[200px] flex flex-col justify-end group cursor-pointer">
              <span className="text-sm font-medium text-lg-color-brand-blue mb-2">Interactive State</span>
              <h3 className="text-xl font-bold text-lg-color-text-ink group-hover:text-lg-color-brand-blue transition-colors">
                Interaktívna Karta
              </h3>
              <p className="text-lg-color-text-slate mt-2">
                Karta s hover efektom, jemným zdvihom a vrstveným tieňom.
              </p>
            </div>
          </section>

          {/* Controls Section */}
          <section className="space-y-8">
            <div className="flex items-center gap-3 mb-6">
              <MousePointer2 className="w-6 h-6 text-lg-color-brand-blue" />
              <h2 className="text-2xl font-semibold text-lg-color-brand-blue-dark">Buttons & Inputs</h2>
            </div>

            <div className="space-y-6">
              <div className="p-10 lg-glass-card flex flex-col gap-6 items-center">
                <button className="lg-btn-aurora w-full">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Objednať sa (Aurora)
                </button>
                
                <button className="lg-btn-glass w-full">
                  Zobraziť Viac (Glass)
                </button>
              </div>

              <div className="p-10 lg-glass-card space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <Type className="w-4 h-4 text-lg-color-brand-blue" />
                  <span className="text-sm font-semibold uppercase tracking-wider text-lg-color-brand-blue">Formulár</span>
                </div>
                <input 
                  type="text" 
                  placeholder="Zadajte svoje meno..." 
                  className="lg-input-glass"
                />
                <input 
                  type="email" 
                  placeholder="vas@email.sk" 
                  className="lg-input-glass"
                />
              </div>
            </div>
          </section>

        </div>

        <footer className="mt-24 pt-12 border-t border-lg-color-brand-blue/10 text-center">
          <p className="text-sm text-lg-color-text-slate opacity-60">
            Liquid Glass Design Tokens v1.0 • FYZIOAFIT Premium
          </p>
        </footer>
      </div>
    </div>
  );
};

export default DesignShowcase;

