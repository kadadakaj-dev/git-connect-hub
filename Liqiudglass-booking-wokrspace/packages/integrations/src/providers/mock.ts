import {
  AvailabilitySlot,
  BookingDTO,
  BookingProvider,
  CreateBookingInput,
  ProviderContext
} from "@bookinggg/core";

export class MockProvider implements BookingProvider {
  async ping(): Promise<boolean> {
    return true;
  }

  async listAvailability(
    _context: ProviderContext,
    params: { from: string; to: string; serviceId?: string; staffId?: string }
  ): Promise<AvailabilitySlot[]> {
    return [
      {
        startAt: params.from,
        endAt: params.to,
        serviceId: params.serviceId,
        staffId: params.staffId
      }
    ];
  }

  async createBooking(
    context: ProviderContext,
    input: CreateBookingInput
  ): Promise<BookingDTO> {
    return {
      id: `mock-${Date.now()}`,
      tenantId: context.tenantId,
      providerId: "mock",
      externalReservationId: `ext-${Date.now()}`,
      status: "CONFIRMED",
      startAt: input.startAt,
      endAt: input.endAt,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      notes: input.notes
    };
  }

  async cancelBooking(): Promise<void> {
    return undefined;
  }

  async listBookings(
    context: ProviderContext,
    params: { from: string; to: string }
  ): Promise<BookingDTO[]> {
    return [
      {
        id: "mock-1",
        tenantId: context.tenantId,
        providerId: "mock",
        externalReservationId: "ext-1",
        status: "CONFIRMED",
        startAt: params.from,
        endAt: params.to,
        customerName: "Mock Customer"
      }
    ];
  }
}
