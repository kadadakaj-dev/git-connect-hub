import { Helmet } from 'react-helmet-async';

const LocalBusinessJsonLd = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    "@id": "https://booking.fyzioafit.sk/#business",
    "name": "FYZIO&FIT",
    "alternateName": "FYZIO&FIT - Fyzioterapia a chiropraktika",
    "description": "Odborná fyzioterapia a chiropraktika v Košiciach. Online rezervácia termínov.",
    "url": "https://booking.fyzioafit.sk",
    "telephone": "+421905307198",
    "email": "booking@fyzioafit.sk",
    "image": "https://booking.fyzioafit.sk/og-image.png",
    "logo": "https://booking.fyzioafit.sk/og-image.png",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Krmanová 6",
      "addressLocality": "Košice",
      "postalCode": "040 01",
      "addressCountry": "SK"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 48.7164,
      "longitude": 21.2611
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:30",
        "closes": "18:30"
      }
    ],
    "priceRange": "€€",
    "paymentAccepted": "Cash, Credit Card",
    "currenciesAccepted": "EUR",
    "areaServed": {
      "@type": "City",
      "name": "Košice"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Služby",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Fyzioterapia",
            "description": "Komplexná fyzioterapeutická starostlivosť"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Chiropraktika",
            "description": "Odborná chiropraktická liečba"
          }
        }
      ]
    },
    "sameAs": [
      "https://instagram.com/jaro_fyziofit",
      "https://www.facebook.com/Jaro.Begala/"
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  );
};

export default LocalBusinessJsonLd;
