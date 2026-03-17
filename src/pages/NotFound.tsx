import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import PageMeta from '@/components/seo/PageMeta';
import GlassBackground from '@/components/GlassBackground';
import GlassCard from '@/components/booking/GlassCard';

const NotFound = () => {
  const location = useLocation();
  const { language } = useLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-app-screen items-center justify-center relative overflow-hidden">
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
        <h1 className="mb-2 text-6xl font-heading font-bold text-foreground">404</h1>
        <p className="mb-6 text-lg text-muted-foreground">
          {language === 'sk' ? 'Stránka nenájdená' : 'Page not found'}
        </p>
        <Button asChild variant="default" size="lg" className="gap-2 rounded-xl">
          <Link to="/">
            <Home className="w-4 h-4" />
            {language === 'sk' ? 'Späť na hlavnú stránku' : 'Back to Home'}
          </Link>
        </Button>
      </GlassCard>
    </div>
  );
};

export default NotFound;
