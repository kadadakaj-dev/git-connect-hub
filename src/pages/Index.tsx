import { Helmet } from 'react-helmet-async';
import BookingWizard from '@/components/booking/BookingWizard';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Rezervácia termínu | FYZIO&FIT - Fyzioterapia a chiropraktika</title>
        <meta 
          name="description" 
          content="Rezervujte si termín fyzioterapie alebo chiropraktiky online. Jednoduché plánovanie, okamžité potvrdenie. FYZIO&FIT ponúka odbornú starostlivosť pre vaše zdravie." 
        />
      </Helmet>
      <BookingWizard />
    </>
  );
};

export default Index;
