import { Helmet } from 'react-helmet-async';
import BookingWizard from '@/components/booking/BookingWizard';
import LocalBusinessJsonLd from '@/components/seo/LocalBusinessJsonLd';
import PageMeta from '@/components/seo/PageMeta';
import ReviewsSection from '@/components/home/ReviewsSection';

const Index = () => {
  return (
    <>
      <PageMeta
        titleSk="Rezervácia termínu | FYZIOAFIT - Fyzioterapia a chiropraktika"
        titleEn="Book Appointment | FYZIOAFIT - Physiotherapy & Chiropractic"
        descriptionSk="Rezervujte si termín fyzioterapie alebo chiropraktiky online. Jednoduché plánovanie, okamžité potvrdenie. FYZIOAFIT ponúka odbornú starostlivosť pre vaše zdravie."
        descriptionEn="Book your physiotherapy or chiropractic appointment online. Easy scheduling, instant confirmation. FYZIOAFIT offers professional care for your health."
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
