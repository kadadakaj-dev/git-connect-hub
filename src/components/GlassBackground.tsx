const GlassBackground = () => (
  <div
    className="fixed inset-0 z-0 pointer-events-none select-none"
    style={{
      background: [
        "radial-gradient(circle at 0% 0%, rgba(255,255,255,0.85) 0%, transparent 50%)",
        "radial-gradient(circle at 100% 100%, rgba(255,255,255,0.55) 0%, transparent 50%)",
        "radial-gradient(ellipse 480px 480px at -8% -8%, rgba(147,197,253,0.32) 0%, transparent 68%)",
        "radial-gradient(ellipse 360px 360px at 108% 108%, rgba(125,211,252,0.22) 0%, transparent 68%)",
        "radial-gradient(ellipse 300px 300px at 108% 38%, rgba(165,180,252,0.18) 0%, transparent 68%)",
        "radial-gradient(ellipse 680px 480px at 50% 50%, rgba(255,255,255,0.38) 0%, transparent 68%)",
        "linear-gradient(135deg, #f0f7ff 0%, #f8faff 50%, #f0f5ff 100%)",
      ].join(", "),
    }}
  />
);

export default GlassBackground;
