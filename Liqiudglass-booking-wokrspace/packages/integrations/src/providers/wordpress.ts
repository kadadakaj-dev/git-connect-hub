import {
  AvailabilitySlot,
  BookingDTO,
  BookingProvider,
  CreateBookingInput,
  ProviderContext
} from "@bookinggg/core";

export type WordPressClient = {
  get<T>(path: string, params?: Record<string, string>): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
};

export class WordPressProvider implements BookingProvider {
  constructor(private readonly client: WordPressClient) {}

  async ping(): Promise<boolean> {
    return true;
  }

  async listAvailability(
    _context: ProviderContext,
    params: { from: string; to: string; serviceId?: string; staffId?: string }
  ): Promise<AvailabilitySlot[]> {
    return this.client.get("/wp-json/ubm/v1/slots", {
      from: params.from,
      to: params.to,
      serviceId: params.serviceId ?? "",
      staffId: params.staffId ?? ""
    });
  }

  async createBooking(
    _context: ProviderContext,
    input: CreateBookingInput
  ): Promise<BookingDTO> {
    return this.client.post("/wp-json/ubm/v1/bookings", input);
  }

  async cancelBooking(
    _context: ProviderContext,
    bookingId: string
  ): Promise<void> {
    await this.client.post(`/wp-json/ubm/v1/bookings/${bookingId}/cancel`);
  }

  async listBookings(
    _context: ProviderContext,
    params: { from: string; to: string }
  ): Promise<BookingDTO[]> {
    return this.client.get("/wp-json/ubm/v1/bookings", {
      from: params.from,
      to: params.to
    });
  }
}
