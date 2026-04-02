const GlassBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none bg-slate-50/50">
    {/* Clean, minimalist background without distracting blobs */}
    <div
      className="absolute inset-0"
      style={{
        background: 'radial-gradient(circle at 0% 0%, rgba(255,255,255,0.8) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(255,255,255,0.5) 0%, transparent 50%)',
      }}
    />
  </div>
);

export default GlassBackground;
