import { Injectable } from "@nestjs/common";
import { TenantProviderConfig } from "@bookinggg/core";
import { PrismaService } from "./prisma.service";

@Injectable()
export class PrismaTenantConfigStore {
  constructor(private readonly prisma: PrismaService) {}

  async getLatestConfig(tenantId: string): Promise<TenantProviderConfig> {
    const integration = await this.prisma.integration.findFirst({
      where: { tenantId, isEnabled: true, deletedAt: null },
      orderBy: { updatedAt: "desc" }
    });

    if (!integration) {
      throw new Error("Integration not found");
    }

    let secrets: Record<string, unknown> = {};
    try {
      secrets = JSON.parse(integration.secretsEnc ?? "{}");
    } catch {
      secrets = {};
    }

    return {
      tenantId,
      integrationId: integration.id,
      providerKey: integration.providerKey,
      baseUrl: integration.baseUrl,
      settings: integration.settings as Record<string, unknown>,
      secrets
    };
  }
}
