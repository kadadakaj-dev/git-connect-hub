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

const PlaceIDLink = "https://search.google.com/local/writereview?placeid=ChIJ3fVzntKZEEcRZ_i8jL8f7d4";

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
            className="glass-card p-6 md:p-8 rounded-[32px] border-[#E8EAED]/50 flex flex-col md:flex-row items-center justify-between gap-8"
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
                  <h2 className="text-2xl md:text-3xl font-black text-[#202124]">FYZIO&FIT</h2>
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
                {language === 'sk' ? 'Napísať recenziu' : 'Write a Review'}
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
              className="glass-card p-8 rounded-[32px] group relative overflow-hidden flex flex-col h-full hover:shadow-xl transition-all border-[#E8EAED]/50"
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
                <img 
                  src="https://www.gstatic.com/images/branding/googlelogo/svg/googlelogo_clr_74x24dp.svg" 
                  alt="Google" 
                  className="h-3 w-auto invert dark:invert-0 grayscale"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;
