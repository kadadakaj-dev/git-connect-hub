export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  price: number;
  category: 'physiotherapy' | 'chiropractic';
  icon: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  bookedCount: number;
  totalCapacity: number;
}

export interface BookingData {
  service: Service | null;
  date: Date | null;
  time: string | null;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  notes: string;
}

export interface BookingStep {
  id: number;
  title: string;
  description: string;
}
