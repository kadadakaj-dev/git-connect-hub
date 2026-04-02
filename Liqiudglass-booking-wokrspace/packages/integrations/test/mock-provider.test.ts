import { MockProvider } from "../src/providers/mock";

describe("MockProvider", () => {
  it("creates booking and lists slots", async () => {
    const provider = new MockProvider();
    const context = {
      tenantId: "tenant_1",
      config: {
        tenantId: "tenant_1",
        integrationId: "integration_1",
        providerKey: "mock",
        baseUrl: "https://mock",
        settings: {},
        secrets: {}
      }
    };

    const slots = await provider.listAvailability(context, {
      from: "2024-01-01T10:00:00.000Z",
      to: "2024-01-01T11:00:00.000Z"
    });

    const booking = await provider.createBooking(context, {
      startAt: slots[0].startAt,
      endAt: slots[0].endAt,
      customerName: "Mock"
    });

    expect(slots).toHaveLength(1);
    expect(booking.customerName).toBe("Mock");
  });
});
