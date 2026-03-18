import PageMeta from '@/components/seo/PageMeta';
import { ArrowLeft, FileText, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/i18n/LanguageContext';
import { Link, useSearchParams } from 'react-router-dom';
import Footer from '@/components/Footer';
import GlassBackground from '@/components/GlassBackground';
import GlassCard from '@/components/booking/GlassCard';

const Legal = () => {
  const { language } = useLanguage();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'terms';

  const handleTabChange = (tab: string) => {
    searchParams.set('tab', tab);
  };
  const content = {
    sk: {
      pageTitle: 'Právne dokumenty | FYZIO&FIT',
      pageDescription: 'Obchodné podmienky a zásady ochrany osobných údajov FYZIO&FIT',
      backToHome: 'Späť na rezerváciu',
      terms: {
        title: 'Obchodné podmienky',
        sections: [
          { heading: '1. Základné ustanovenia', text: 'Tieto obchodné podmienky upravujú vzťahy medzi poskytovateľom služieb FYZIO&FIT (ďalej len \\\"poskytovateľ\\\") a klientom pri poskytovaní fyzioterapeutických a chiropraktických služieb.' },
          { heading: '2. Rezervácia termínu', text: 'Rezerváciu je možné vykonať prostredníctvom online rezervačného systému. Po úspešnej rezervácii obdrží klient potvrdzujúci email s detailmi o termíne. Rezervácia je záväzná po jej potvrdení.' },
          { heading: '3. Zrušenie a zmena termínu', text: 'Rezerváciu je možné zrušiť online najneskôr 12 hodín pred termínom. Menej ako 12 hodín pred termínom je zrušenie možné, len telefonicky: +421 905 307 198 ale bude Vám účtovaný storno poplatok 10 €.' },
          { heading: '4. Platobné podmienky', text: 'Platba za služby sa uskutočňuje v hotovosti alebo platobnou kartou priamo na mieste po poskytnutí služby. Ceny služieb sú uvedené v cenníku na webovej stránke.' },
          { heading: '5. Zodpovednosť', text: 'Klient je povinný informovať poskytovateľa o svojom zdravotnom stave, prebiehajúcej liečbe a užívaných liekoch. Poskytovateľ nenesie zodpovednosť za komplikácie vzniknuté zatajením zdravotných informácií.' },
          { heading: '6. Záverečné ustanovenia', text: 'Tieto obchodné podmienky nadobúdajú platnosť dňom ich zverejnenia. Poskytovateľ si vyhradzuje právo na zmenu obchodných podmienok.' },
        ],
      },
      privacy: {
        title: 'Ochrana osobných údajov (GDPR)',
        sections: [
          { heading: '1. Prevádzkovateľ', text: 'Prevádzkovateľom osobných údajov je FYZIO&FIT, Krmanová 6, Košice. Kontakt: +421 905 307 198, booking@fyzioafit.sk' },
          { heading: '2. Aké údaje spracovávame', text: 'Spracovávame nasledovné osobné údaje: meno a priezvisko, telefónne číslo, emailová adresa, údaje o rezerváciách a poznámky k zdravotnému stavu poskytnuté klientom.' },
          { heading: '3. Účel spracovania', text: 'Osobné údaje spracovávame za účelom: poskytovania objednaných služieb, správy rezervácií, komunikácie s klientom, zasielania potvrdení a pripomienok termínov.' },
          { heading: '4. Právny základ', text: 'Spracovanie osobných údajov je nevyhnutné na plnenie zmluvy (poskytnutie služby). Pre zasielanie marketingových oznámení vyžadujeme výslovný súhlas.' },
          { heading: '5. Doba uchovávania', text: 'Osobné údaje uchovávame po dobu nevyhnutnú na splnenie účelu spracovania, najdlhšie však 3 roky od poslednej návštevy, ak zákon neustanovuje inak.' },
          { heading: '6. Vaše práva', text: 'Máte právo na prístup k svojim údajom, ich opravu, vymazanie, obmedzenie spracovania, prenosnosť údajov a právo namietať proti spracovaniu. Svoje práva môžete uplatniť kontaktovaním prevádzkovateľa.' },
          { heading: '7. Zabezpečenie údajov', text: 'Vaše osobné údaje sú chránené primeranými technickými a organizačnými opatreniami proti neoprávnenému prístupu, strate alebo zneužitiu.' },
        ],
      },
    },
    en: {
      pageTitle: 'Legal Documents | FYZIO&FIT',
      pageDescription: 'Terms of Service and Privacy Policy of FYZIO&FIT',
      backToHome: 'Back to booking',
      terms: {
        title: 'Terms of Service',
        sections: [
          { heading: '1. General Provisions', text: 'These terms of service govern the relationship between the service provider FYZIO&FIT (hereinafter \\\"provider\\\") and the client in providing physiotherapy and chiropractic services.' },
          { heading: '2. Appointment Booking', text: 'Bookings can be made through the online reservation system. Upon successful booking, the client will receive a confirmation email with appointment details. The booking is binding upon confirmation.' },
          { heading: '3. Cancellation and Rescheduling', text: 'You can cancel online up to 12 hours before your appointment. Less than 12 hours before, cancellation is only possible by phone: +421 905 307 198 and a cancellation fee of €10 will be charged.' },
          { heading: '4. Payment Terms', text: 'Payment for services is made in cash or by card directly on-site after the service is provided. Service prices are listed in the price list on the website.' },
          { heading: '5. Liability', text: 'The client is obliged to inform the provider about their health condition, ongoing treatment, and medications. The provider is not responsible for complications arising from concealment of health information.' },
          { heading: '6. Final Provisions', text: 'These terms of service become effective on the date of their publication. The provider reserves the right to change the terms of service.' },
        ],
      },
      privacy: {
        title: 'Privacy Policy (GDPR)',
        sections: [
          { heading: '1. Data Controller', text: 'The data controller is FYZIO&FIT, Krmanová 6, Košice. Contact: +421 905 307 198, booking@fyzioafit.sk' },
          { heading: '2. Data We Process', text: 'We process the following personal data: name and surname, phone number, email address, booking information, and health-related notes provided by the client.' },
          { heading: '3. Purpose of Processing', text: 'We process personal data for: providing requested services, managing reservations, communicating with clients, sending confirmations and appointment reminders.' },
          { heading: '4. Legal Basis', text: 'Processing of personal data is necessary for the performance of a contract (service provision). For marketing communications, we require explicit consent.' },
          { heading: '5. Retention Period', text: 'We retain personal data for the period necessary to fulfill the purpose of processing, but no longer than 3 years from the last visit, unless the law provides otherwise.' },
          { heading: '6. Your Rights', text: 'You have the right to access, rectify, erase, restrict processing, data portability, and object to processing. You can exercise your rights by contacting the data controller.' },
          { heading: '7. Data Security', text: 'Your personal data is protected by appropriate technical and organizational measures against unauthorized access, loss, or misuse.' },
        ],
      },
    },
  };

  const t = content[language];

  return (
    <>
      <PageMeta
        titleSk="Právne dokumenty | FYZIO&FIT"
        titleEn="Legal Documents | FYZIO&FIT"
        descriptionSk="Obchodné podmienky a zásady ochrany osobných údajov FYZIO&FIT"
        descriptionEn="Terms of service and privacy policy of FYZIO&FIT"
        path={`/legal?tab=${defaultTab}`}
      />

      <div className="min-h-screen relative overflow-hidden flex flex-col">
        <GlassBackground />
        <div className="container max-w-4xl mx-auto px-4 py-8 md:py-12 flex-1 relative z-10">
          <Link to="/">
            <Button variant="ghost" className="gap-2 mb-6">
              <ArrowLeft className="w-4 h-4" />
              {t.backToHome}
            </Button>
          </Link>

          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-heading font-semibold text-foreground mb-2">
              FYZIO&FIT
            </h1>
          </div>

          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="terms" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <FileText className="w-4 h-4 hidden sm:block shrink-0" />
                <span className="truncate">{t.terms.title}</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="gap-1.5 text-xs sm:text-sm px-2 sm:px-3">
                <Shield className="w-4 h-4 hidden sm:block shrink-0" />
                <span className="truncate">{t.privacy.title}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="terms">
              <GlassCard className="rounded-[24px] p-6 md:p-8">
                <h2 className="text-2xl font-bold text-foreground mb-6">{t.terms.title}</h2>
                <div className="space-y-6">
                  {t.terms.sections.map((section, index) => (
                    <div key={index}>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{section.heading}</h3>
                      <p className="text-muted-foreground leading-relaxed">{section.text}</p>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-8 pt-6 border-t border-border">
                  {language === 'sk' ? 'Posledná aktualizácia: Marec 2026' : 'Last updated: March 2026'}
                </p>
              </GlassCard>
            </TabsContent>

            <TabsContent value="privacy">
              <GlassCard className="rounded-[24px] p-6 md:p-8">
                <h2 className="text-2xl font-bold text-foreground mb-6">{t.privacy.title}</h2>
                <div className="space-y-6">
                  {t.privacy.sections.map((section, index) => (
                    <div key={index}>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{section.heading}</h3>
                      <p className="text-muted-foreground leading-relaxed">{section.text}</p>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-8 pt-6 border-t border-border">
                  {language === 'sk' ? 'Posledná aktualizácia: Marec 2026' : 'Last updated: March 2026'}
                </p>
              </GlassCard>
            </TabsContent>
          </Tabs>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default Legal;
