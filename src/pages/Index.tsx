import { Helmet } from 'react-helmet-async';
import BookingWizard from '@/components/booking/BookingWizard';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Book Appointment | PhysioWell Clinic - Physiotherapy & Chiropractic</title>
        <meta 
          name="description" 
          content="Book your physiotherapy or chiropractic appointment online. Easy scheduling, instant confirmation. PhysioWell Clinic offers expert care for your wellness journey." 
        />
      </Helmet>
      <BookingWizard />
    </>
  );
};

export default Index;
