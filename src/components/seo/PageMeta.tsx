import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/i18n/LanguageContext';

interface PageMetaProps {
  titleSk: string;
  titleEn: string;
  descriptionSk: string;
  descriptionEn: string;
  path: string;
  noindex?: boolean;
}

const BASE_URL = 'https://booking.fyzioafit.sk';
const OG_IMAGE = `${BASE_URL}/og-image.png`;

const PageMeta = ({ titleSk, titleEn, descriptionSk, descriptionEn, path, noindex }: PageMetaProps) => {
  const { language } = useLanguage();
  const title = language === 'sk' ? titleSk : titleEn;
  const description = language === 'sk' ? descriptionSk : descriptionEn;
  const url = `${BASE_URL}${path}`;

  return (
    <Helmet>
      <html lang={language} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Hreflang */}
      <link rel="alternate" hrefLang="sk" href={url} />
      <link rel="alternate" hrefLang="en" href={url} />
      <link rel="alternate" hrefLang="x-default" href={url} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={OG_IMAGE} />
      <meta property="og:locale" content={language === 'sk' ? 'sk_SK' : 'en_US'} />
      <meta property="og:locale:alternate" content={language === 'sk' ? 'en_US' : 'sk_SK'} />
      <meta property="og:site_name" content="FYZIO&FIT" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={OG_IMAGE} />

      {noindex && <meta name="robots" content="noindex, nofollow" />}
    </Helmet>
  );
};

export default PageMeta;
