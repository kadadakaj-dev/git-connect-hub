import { Injectable } from "@nestjs/common";

import { BookingDTO, CreateBookingInput, ProviderContext } from "@bookinggg/core";

type UnifiedBookingRecord = {
  id: string;
  tenantId: string;
  providerId: string;
  externalReservationId: string;
  status: string;
  startAt: Date;
  endAt: Date;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  notes: string | null;
};

type BookingRecord = {
  id: string;
  userId: string | null;
  serviceId: bigint;
  startTime: Date;
  endTime: Date;
  status: string;
  notes: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
};

type BookingDelegate = {
  findMany(args: { where: { startTime?: { gte?: Date }; endTime?: { lte?: Date } }; orderBy: { startTime: string } }): Promise<BookingRecord[]>;
  create(args: { data: { serviceId: bigint; startTime: Date; endTime: Date; status: string; customerName?: string | null; customerEmail?: string | null; customerPhone?: string | null; notes?: string | null; userId: string | null } }): Promise<BookingRecord>;
  update(args: { where: { id: string }; data: { status: string } }): Promise<BookingRecord>;
};

import { PrismaService } from "./prisma.service";
import { PrismaTenantConfigStore } from "./prisma-tenant-config.store";
import { ProviderFactory } from "./provider.factory";

import { AvailabilityService } from "./availability.service";

@Injectable()
export class BookingAdapterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configStore: PrismaTenantConfigStore,
    private readonly providerFactory: ProviderFactory,
    private readonly availabilityService: AvailabilityService
  ) { }

  private get supabaseBooking(): BookingDelegate {
    return (this.prisma as unknown as { booking: BookingDelegate }).booking;
  }

  async getSlots(
    tenantId: string,
    from: string,
    to: string,
    serviceId?: string,
    staffId?: string
  ) {
    const config = await this.configStore.getLatestConfig(tenantId);

    // Internal Supabase logic
    if (config.providerKey === "mock" || config.providerKey === "supabase") {
      if (!serviceId) return [];
      // for now, we only support single day view in getSlots if not specified otherwise
      // but let's assume 'from' is the date
      const date = from.split("T")[0];
      return this.availabilityService.getAvailableSlots(tenantId, date, serviceId);
    }

    const provider = this.providerFactory.getProvider(config);
    const context: ProviderContext = { tenantId, config };
    return provider.listAvailability(context, { from, to, serviceId, staffId });
  }

  async listBookings(tenantId: string, from: string, to: string) {
    const config = await this.configStore.getLatestConfig(tenantId);

    if (config.providerKey === "supabase" || config.providerKey === "mock") {
      const bookings = await this.supabaseBooking.findMany({
        where: {
          startTime: { gte: new Date(from) },
          endTime: { lte: new Date(to) }
        },
        orderBy: { startTime: "asc" }
      });
      return bookings.map((b: BookingRecord) => ({
        id: b.id,
        tenantId,
        providerId: config.providerKey,
        externalReservationId: b.id,
        status: b.status,
        startAt: b.startTime.toISOString(),
        endAt: b.endTime.toISOString(),
        customerName: b.customerName,
        customerEmail: b.customerEmail,
        customerPhone: b.customerPhone,
        notes: b.notes
      }));
    }

    const bookings = await this.prisma.unifiedBooking.findMany({
      where: {
        tenantId,
        startAt: { gte: new Date(from) },
        endAt: { lte: new Date(to) }
      },
      orderBy: { startAt: "asc" }
    });
    return bookings.map(this.toDTO);
  }

  async createBooking(
    tenantId: string,
    input: CreateBookingInput,
    idempotencyKey?: string
  ) {
    // Internal Supabase Validation
    if (!input.serviceId) {
      throw new Error("serviceId is required for booking.");
    }
    const isValid = await this.availabilityService.validateBooking(
      input.startAt,
      input.endAt,
      input.serviceId
    );
    if (!isValid) {
      throw new Error("Invalid booking: slot is either closed or overlapping.");
    }

    const config = await this.configStore.getLatestConfig(tenantId);

    if (config.providerKey === "supabase" || config.providerKey === "mock") {
      const booking = await this.supabaseBooking.create({
        data: {
          serviceId: BigInt(input.serviceId),
          startTime: new Date(input.startAt),
          endTime: new Date(input.endAt),
          status: "confirmed", // Default confirmed for direct DB bookings
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          customerPhone: input.customerPhone,
          notes: input.notes,
          userId: null // We'll handle userId better once Auth is fully linked
        }
      });
      return {
        id: booking.id,
        tenantId,
        providerId: config.providerKey,
        externalReservationId: booking.id,
        status: booking.status,
        startAt: booking.startTime.toISOString(),
        endAt: booking.endTime.toISOString(),
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
        notes: booking.notes
      };
    }

    if (idempotencyKey) {
      const existing = await this.prisma.unifiedBooking.findFirst({
        where: { tenantId, idempotencyKey }
      });
      if (existing) {
        return this.toDTO(existing);
      }
    }

    const provider = this.providerFactory.getProvider(config);
    const context: ProviderContext = { tenantId, config };
    const providerBooking = await provider.createBooking(context, input);

    try {
      const booking = await this.prisma.unifiedBooking.create({
        data: {
          tenantId,
          integrationId: config.integrationId,
          providerId: providerBooking.providerId,
          externalReservationId: providerBooking.externalReservationId,
          status: providerBooking.status,
          startAt: new Date(providerBooking.startAt),
          endAt: new Date(providerBooking.endAt),
          customerName: providerBooking.customerName,
          customerEmail: providerBooking.customerEmail,
          customerPhone: providerBooking.customerPhone,
          notes: providerBooking.notes,
          idempotencyKey
        }
      });
      return this.toDTO(booking);
    } catch (error) {
      if (this.isUniqueViolation(error) && idempotencyKey) {
        const existing = await this.prisma.unifiedBooking.findFirst({
          where: { tenantId, idempotencyKey }
        });
        if (existing) return this.toDTO(existing);
      }
      throw error;
    }
  }

  async cancelBooking(tenantId: string, bookingId: string) {
    return this.updateBookingStatus(tenantId, bookingId, "cancelled");
  }

  async updateBookingStatus(tenantId: string, bookingId: string, status: string) {
    const config = await this.configStore.getLatestConfig(tenantId);

    if (config.providerKey === "supabase" || config.providerKey === "mock") {
      const booking = await this.supabaseBooking.update({
        where: { id: bookingId },
        data: { status: status.toLowerCase() }
      });
      return {
        id: booking.id,
        tenantId,
        providerId: config.providerKey,
        externalReservationId: booking.id,
        status: booking.status,
        startAt: booking.startTime.toISOString(),
        endAt: booking.endTime.toISOString(),
        customerName: booking.customerName
      };
    }

    const booking = await this.prisma.unifiedBooking.update({
      where: { id: bookingId },
      data: { status: status.toUpperCase() }
    });
    return this.toDTO(booking);
  }

  private toDTO(booking: UnifiedBookingRecord): BookingDTO {
    return {
      id: booking.id,
      tenantId: booking.tenantId,
      providerId: booking.providerId,
      externalReservationId: booking.externalReservationId,
      status: booking.status,
      startAt: booking.startAt.toISOString(),
      endAt: booking.endAt.toISOString(),
      customerName: booking.customerName,
      customerEmail: booking.customerEmail ?? undefined,
      customerPhone: booking.customerPhone ?? undefined,
      notes: booking.notes ?? undefined
    };
  }

  private isUniqueViolation(error: unknown) {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    );
  }
}
