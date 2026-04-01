import { motion } from 'framer-motion';
import { Star, Quote, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';

const reviews = [
  {
    id: 1,
    name: 'Marek H.',
    rating: 5,
    text_sk: 'Absolútna spokojnosť. Profesionálny prístup a moderné prostredie. Moje bolesti chrbta zmizli už po tretej návšteve.',
    text_en: 'Absolute satisfaction. Professional approach and modern environment. My back pain disappeared after the third visit.',
    date: 'pred 2 mesiacmi',
  },
  {
    id: 2,
    name: 'Zuzana K.',
    rating: 5,
    text_sk: 'Najlepšia chiropraxia v meste. Personál je veľmi milý a odborný. Rezervácia termínu online je super rýchla.',
    text_en: 'The best chiropractic in town. The staff is very kind and professional. Online booking is super fast.',
    date: 'pred 1 mesiacom',
  },
  {
    id: 3,
    name: 'Peter M.',
    rating: 5,
    text_sk: 'Hľadal som odbornú pomoc dlho, až kým som nenašiel Personal FYZIO&FIT. Odporúčam každému športovcovi.',
    text_en: 'I had been looking for professional help for a long time until I found Personal FYZIO&FIT. I recommend it to every athlete.',
    date: 'pred 3 týždňami',
  },
];

const ReviewsSection = () => {
  const { language } = useLanguage();

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--deep-navy))] mb-4">
              {language === 'sk' ? 'Čo hovoria naši klienti' : 'What our clients say'}
            </h2>
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <span className="font-bold text-[hsl(var(--soft-navy))]">5.0 / 5.0</span>
              <span className="text-muted-foreground ml-2">na Google</span>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {reviews.map((review, idx) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="glass-card p-8 rounded-[32px] group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="bg-primary/5 p-3 rounded-2xl">
                  <Quote className="w-6 h-6 text-primary opacity-40" />
                </div>
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-[hsl(var(--soft-navy))] leading-relaxed mb-6 italic">
                "{language === 'sk' ? review.text_sk : review.text_en}"
              </p>
              <div className="flex items-center gap-4 border-t border-[var(--glass-border-subtle)] pt-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-bold text-primary">
                  {review.name[0]}
                </div>
                <div>
                  <h4 className="font-bold text-[hsl(var(--deep-navy))]">{review.name}</h4>
                  <p className="text-xs text-muted-foreground">{review.date}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <Button
            variant="outline"
            className="rounded-full px-8 py-6 h-auto text-lg font-bold border-primary/20 hover:bg-primary/5 group"
            asChild
          >
            <a href="https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID" target="_blank" rel="noopener noreferrer">
              {language === 'sk' ? 'Napísať recenziu na Google' : 'Write a Review on Google'}
              <ExternalLink className="ml-2 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;
