import { BookingProvider, ProviderRegistry } from "@bookinggg/core";

export class InMemoryProviderRegistry implements ProviderRegistry {
  private providers = new Map<string, BookingProvider>();

  register(providerKey: string, provider: BookingProvider) {
    this.providers.set(providerKey, provider);
  }

  getProvider(providerKey: string) {
    return this.providers.get(providerKey);
  }
}
