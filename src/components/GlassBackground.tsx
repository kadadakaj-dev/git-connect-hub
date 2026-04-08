import React from "react";

const GlassBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none bg-slate-50/50">
    {/* Base premium gradients */}
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(circle at 0% 0%, rgba(255,255,255,0.8) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(255,255,255,0.5) 0%, transparent 50%)",
      }}
    />

    {/* Luxury Liquid Glass Blobs (Centralized for 100% consistency) */}
    <div
      className="glass-blob w-[400px] h-[400px] -top-20 -left-20 bg-blue-200/40"
      style={{ "--blob-dur": "26s" } as React.CSSProperties}
    />
    <div
      className="glass-blob w-[300px] h-[300px] -bottom-20 -right-20 bg-sky-200/30"
      style={{ "--blob-dur": "22s" } as React.CSSProperties}
    />
    
    {/* Subtle center glow to tie it together */}
    <div 
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/40 blur-[120px] rounded-full"
    />
  </div>
);

export default GlassBackground;
