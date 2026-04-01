import { Helmet } from 'react-helmet-async';
import BookingWizard from '@/components/booking/BookingWizard';
import LocalBusinessJsonLd from '@/components/seo/LocalBusinessJsonLd';
import PageMeta from '@/components/seo/PageMeta';
import ReviewsSection from '@/components/home/ReviewsSection';

const Index = () => {
  return (
    <>
      <PageMeta
        titleSk="Rezervácia termínu | FYZIO&FIT - Fyzioterapia a chiropraktika"
        titleEn="Book Appointment | FYZIO&FIT - Physiotherapy & Chiropractic"
        descriptionSk="Rezervujte si termín fyzioterapie alebo chiropraktiky online. Jednoduché plánovanie, okamžité potvrdenie. FYZIO&FIT ponúka odbornú starostlivosť pre vaše zdravie."
        descriptionEn="Book your physiotherapy or chiropractic appointment online. Easy scheduling, instant confirmation. FYZIO&FIT offers professional care for your health."
        path="/"
      />
      <LocalBusinessJsonLd />
      <main>
        <BookingWizard />
        <ReviewsSection />
      </main>
    </>
  );
};

export default Index;
