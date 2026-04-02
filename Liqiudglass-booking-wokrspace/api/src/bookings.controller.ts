import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query
} from "@nestjs/common";
import { BookingAdapterService } from "./booking-adapter.service";
import { CreateBookingInput } from "@bookinggg/core";

@Controller("/api/tenants/:tenantId")
export class BookingsController {
  constructor(private readonly bookingAdapter: BookingAdapterService) { }

  @Get("/slots")
  getSlots(
    @Param("tenantId") tenantId: string,
    @Query("from") from: string,
    @Query("to") to: string,
    @Query("serviceId") serviceId?: string,
    @Query("staffId") staffId?: string
  ) {
    return this.bookingAdapter.getSlots(tenantId, from, to, serviceId, staffId);
  }

  @Get("/bookings")
  listBookings(
    @Param("tenantId") tenantId: string,
    @Query("from") from: string,
    @Query("to") to: string
  ) {
    return this.bookingAdapter.listBookings(tenantId, from, to);
  }

  @Post("/bookings")
  createBooking(
    @Param("tenantId") tenantId: string,
    @Body() input: CreateBookingInput,
    @Headers("idempotency-key") idempotencyKey?: string
  ) {
    return this.bookingAdapter.createBooking(tenantId, input, idempotencyKey);
  }

  @Post("/bookings/:id/cancel")
  cancelBooking(
    @Param("tenantId") tenantId: string,
    @Param("id") id: string
  ) {
    return this.bookingAdapter.cancelBooking(tenantId, id);
  }

  @Post("/bookings/:id/status")
  updateStatus(
    @Param("tenantId") tenantId: string,
    @Param("id") id: string,
    @Body("status") status: string
  ) {
    return this.bookingAdapter.updateBookingStatus(tenantId, id, status);
  }
}
