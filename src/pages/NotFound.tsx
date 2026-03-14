import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import PageMeta from '@/components/seo/PageMeta';
import GlassBackground from '@/components/GlassBackground';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center relative overflow-hidden">
      <GlassBackground />
      <PageMeta
        titleSk="Stránka nenájdená | FYZIO&FIT"
        titleEn="Page Not Found | FYZIO&FIT"
        descriptionSk="Požadovaná stránka nebola nájdená."
        descriptionEn="The requested page was not found."
        path={location.pathname}
        noindex
      />
      <GlassCard className="p-8 md:p-12 text-center max-w-md mx-4 relative z-10">
        <h1 className="mb-4 text-4xl font-heading font-semibold text-foreground">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
