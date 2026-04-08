import { motion } from 'framer-motion';
import { Star, ExternalLink, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import { cn } from '@/lib/utils';

const reviews = [
  {
    id: 1,
    name: 'Erik B.',
    rating: 5,
    text_sk: 'Všetko top, prijemne prostredie, super pristup, vyborna masáž - 10/10. Určite sa vrátim znova.',
    text_en: 'Everything top, pleasant environment, great approach, excellent massage - 10/10. I will definitely be back.',
    date: 'pred týždňom',
    initial: 'E',
    color: 'bg-[#4285F4]', // Google Blue
    isLocalGuide: true,
  },
  {
    id: 2,
    name: 'Zuzana K.',
    rating: 5,
    text_sk: 'Najlepšia chiropraxia v meste. Personál je veľmi milý a odborný. Rezervácia termínu online je super rýchla.',
    text_en: 'The best chiropractic in town. The staff is very kind and professional. Online booking is super fast.',
    date: 'pred 1 mesiacom',
    initial: 'Z',
    color: 'bg-[#EA4335]', // Google Red
    isLocalGuide: false,
  },
  {
    id: 3,
    name: 'Marek H.',
    rating: 5,
    text_sk: 'Profesionálny prístup a moderné prostredie. Moje bolesti chrbta zmizli už po tretej návšteve. Odporúčam každému.',
    text_en: 'Professional approach and modern environment. My back pain disappeared after the third visit. I recommend it to everyone.',
    date: 'pred 2 mesiacmi',
    initial: 'M',
    color: 'bg-[#FBBC05]', // Google Yellow
    isLocalGuide: true,
  },
];

const PlaceIDLink = "https://search.google.com/local/writereview?placeid=ChIJo6lsOX3HPkcRDJU5ZhNiMdU";

const ReviewsSection = () => {
  const { language } = useLanguage();

  return (
    <section className="py-24 relative overflow-hidden bg-white/50">
      <div className="container mx-auto px-4 relative z-10">
        {/* Google Header Plate */}
        <div className="max-w-4xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg-glass-card p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl shadow-sm border border-[#E8EAED] flex items-center justify-center overflow-hidden flex-shrink-0">
                <svg viewBox="0 0 24 24" className="w-10 h-10 md:w-12 md:h-12">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl md:text-3xl font-black text-[#202124]">FYZIOAFIT</h2>
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-[#3C4043]">5.0</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-[#FBBC05] text-[#FBBC05]" />
                    ))}
                  </div>
                  <span className="text-blue-600 font-medium hover:underline cursor-pointer">
                    178 {language === 'sk' ? 'recenzií' : 'reviews'}
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              className="rounded-full px-6 py-5 h-auto text-base font-bold bg-[#1a73e8] text-white hover:bg-[#1557b0] border-[#1a73e8] shadow-md transition-all group"
              asChild
            >
              <a href={PlaceIDLink} target="_blank" rel="noopener noreferrer">
                {language === 'sk' ? 'Napísať recenziu na Google' : 'Write a Review on Google'}
                <ExternalLink className="ml-2 w-4 h-4 opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </Button>
          </motion.div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review, idx) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="lg-glass-card--interactive p-8 flex flex-col h-full"
            >
              {/* User Identity */}
              <div className="flex items-center gap-4 mb-6">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-medium shadow-inner",
                  review.color
                )}>
                  {review.initial}
                </div>
                <div>
                  <h4 className="font-bold text-[#202124] text-base">{review.name}</h4>
                  <div className="flex items-center gap-2">
                    <p className="text-[12px] text-[#70757A]">{review.date}</p>
                    {review.isLocalGuide && (
                      <span className="text-[10px] font-bold text-[#70757A] bg-[#F1f3f4] px-1.5 py-0.5 rounded uppercase tracking-tighter">
                        Local Guide
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stars */}
              <div className="flex mb-4 gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#FBBC05] text-[#FBBC05]" />
                ))}
              </div>

              {/* Text */}
              <p className="text-[#3C4043] leading-relaxed text-sm flex-grow italic">
                "{language === 'sk' ? review.text_sk : review.text_en}"
              </p>

              {/* Google Verified Logo */}
              <div className="mt-8 flex items-center justify-between opacity-30 group-hover:opacity-60 transition-opacity">
                <div className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-blue-600" />
                  <span className="text-[10px] uppercase font-black tracking-widest text-[#202124]">Verified</span>
                </div>
                <svg viewBox="0 0 74 24" className="h-3 w-auto opacity-70 group-hover:opacity-100 transition-opacity grayscale invert dark:invert-0">
                  <path d="M9.2 11.5v3.3h5.1c-.2 1.1-.8 2-1.7 2.6-1 .7-2.3 1.2-3.4 1.2-3 0-5.4-2.4-5.4-5.4s2.4-5.4 5.4-5.4c1.5 0 2.8.5 3.8 1.4L15.3 7c-1.5-1.4-3.5-2.2-5.7-2.2C5.6 4.8 2.3 8 2.3 12.1s3.3 7.3 7.3 7.3c2.7 0 4.7-.9 6.3-2.6 1.6-1.6 2.1-4.1 2.1-5.6 0-.5-.1-1-.1-1.3l-8.3-.1zm15 1.5c-2.4 0-4.1 1.9-4.1 4.1s1.7 4.1 4.1 4.1c2.4 0 4.1-1.9 4.1-4.1s-1.8-4.1-4.1-4.1zm0 6.6c-1.3 0-2.4-1.1-2.4-2.5s1.1-2.5 2.4-2.5 2.4 1.1 2.4 2.5-1.1 2.5-2.4 2.5zm10.5-6.6c-2.4 0-4.1 1.9-4.1 4.1s1.7 4.1 4.1 4.1c2.4 0 4.1-1.9 4.1-4.1s-1.8-4.1-4.1-4.1zm0 6.6c-1.3 0-2.4-1.1-2.4-2.5s1.1-2.5 2.4-2.5 2.4 1.1 2.4 2.5-1.1 2.5-2.4 2.5zm10.3-6.6c-2.3 0-3.8 1.6-4.2 2.5V11h-1.6v11.7h1.7v-4.5c.5.8 1.9 2.4 4 2.4 2.2 0 4-1.9 4-4.8s-1.8-4.8-3.9-4.8zm-.2 6.6c-1.3 0-2.3-1.1-2.3-2.6s1.1-2.5 2.3-2.5c1.4 0 2.3 1.1 2.3 2.5s-1 2.6-2.3 2.6zM51.1 5h1.7V22.7h-1.7V5zm8.4 8c-2.2 0-4 1.7-4 4.1 0 2.6 2 4.1 4.3 4.1 1.7 0 2.9-.8 3.5-1.8l-1.3-.9c-.4.6-1.1 1-2.2 1-1.2 0-2-.6-2.5-1.6l6.2-2.5-.2-.5c-.4-1.1-1.6-3.9-4.1-3.9zm0 1.5c1 0 1.9.5 2.2 1.3l-4.5 1.9c-.1-1.6 1.1-3.2 2.3-3.2z" fill="currentColor"/>
                </svg>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;

