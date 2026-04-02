import { Injectable } from "@nestjs/common";
import {
  BookingProvider,
  ProviderRegistry,
  TenantProviderConfig
} from "@bookinggg/core";
import { InMemoryProviderRegistry, MockProvider } from "@bookinggg/integrations";

@Injectable()
export class ProviderFactory {
  private readonly registry: ProviderRegistry;

  constructor() {
    const registry = new InMemoryProviderRegistry();
    registry.register("mock", new MockProvider());
    this.registry = registry;
  }

  getProvider(config: TenantProviderConfig): BookingProvider {
    const provider = this.registry.getProvider(config.providerKey);
    if (!provider) {
      throw new Error(`Provider not found: ${config.providerKey}`);
    }
    return provider;
  }
}
