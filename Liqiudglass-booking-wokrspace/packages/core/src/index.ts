export type AvailabilitySlot = {
  startAt: string;
  endAt: string;
  serviceId?: string;
  staffId?: string;
};

export type CreateBookingInput = {
  serviceId?: string;
  staffId?: string;
  startAt: string;
  endAt: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
};

export type BookingDTO = {
  id: string;
  tenantId: string;
  providerId: string;
  externalReservationId: string;
  status: string;
  startAt: string;
  endAt: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
};

export type TenantProviderConfig = {
  tenantId: string;
  integrationId: string;
  providerKey: string;
  baseUrl: string;
  settings: Record<string, unknown>;
  secrets: Record<string, unknown>;
};

export type ProviderContext = {
  tenantId: string;
  config: TenantProviderConfig;
};

export interface BookingProvider {
  ping(context: ProviderContext): Promise<boolean>;
  listAvailability(
    context: ProviderContext,
    params: { from: string; to: string; serviceId?: string; staffId?: string }
  ): Promise<AvailabilitySlot[]>;
  createBooking(context: ProviderContext, input: CreateBookingInput): Promise<BookingDTO>;
  cancelBooking(context: ProviderContext, bookingId: string): Promise<void>;
  listBookings(
    context: ProviderContext,
    params: { from: string; to: string }
  ): Promise<BookingDTO[]>;
}

export interface ProviderRegistry {
  getProvider(providerKey: string): BookingProvider | undefined;
}
