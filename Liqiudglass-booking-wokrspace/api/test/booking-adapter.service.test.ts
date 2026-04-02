import { BookingAdapterService } from "../src/booking-adapter.service";
import { PrismaTenantConfigStore } from "../src/prisma-tenant-config.store";
import { ProviderFactory } from "../src/provider.factory";
import { PrismaService } from "../src/prisma.service";

const mockBooking = {
  id: "booking-1",
  tenantId: "tenant_1",
  integrationId: "integration-1",
  providerId: "mock",
  externalReservationId: "ext-1",
  status: "CONFIRMED",
  startAt: new Date("2024-01-01T10:00:00.000Z"),
  endAt: new Date("2024-01-01T11:00:00.000Z"),
  customerName: "Test",
  customerEmail: null,
  customerPhone: null,
  notes: null,
  idempotencyKey: "idem-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  cancelledAt: null
};

describe("BookingAdapterService", () => {
  it("returns same booking for same idempotency key", async () => {
    const prisma = {
      unifiedBooking: {
        findFirst: jest.fn().mockResolvedValue(mockBooking),
        create: jest.fn()
      }
    } as unknown as PrismaService;

    const configStore = {
      getLatestConfig: jest.fn().mockResolvedValue({
        tenantId: "tenant_1",
        integrationId: "integration-1",
        providerKey: "mock",
        baseUrl: "",
        settings: {},
        secrets: {}
      })
    } as unknown as PrismaTenantConfigStore;

    const providerFactory = {
      getProvider: jest.fn().mockReturnValue({
        createBooking: jest.fn()
      })
    } as unknown as ProviderFactory;

    const service = new BookingAdapterService(prisma, configStore, providerFactory);

    const result = await service.createBooking(
      "tenant_1",
      {
        startAt: "2024-01-01T10:00:00.000Z",
        endAt: "2024-01-01T11:00:00.000Z",
        customerName: "Test"
      },
      "idem-1"
    );

    expect(result.id).toBe(mockBooking.id);
    expect(prisma.unifiedBooking.findFirst).toHaveBeenCalledWith({
      where: { tenantId: "tenant_1", idempotencyKey: "idem-1" }
    });
  });
});
