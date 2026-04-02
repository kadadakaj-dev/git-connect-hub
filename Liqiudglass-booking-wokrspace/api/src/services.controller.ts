import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { ApiKeyGuard } from "./api-key.guard";

@Controller("api/tenants/:tenantId/services")
@UseGuards(ApiKeyGuard)
export class ServicesController {
    constructor(private readonly prisma: PrismaService) { }

    @Get()
    async listServices(@Param("tenantId") tenantId: string) {
        return (this.prisma as any).service.findMany({
            orderBy: { createdAt: "desc" }
        });
    }

    @Post()
    async createService(
        @Param("tenantId") tenantId: string,
        @Body() data: any
    ) {
        return (this.prisma as any).service.create({
            data: {
                ...data,
                price: Number(data.price),
                durationMin: Number(data.durationMin),
                isActive: data.isActive ?? true
            }
        });
    }

    @Put(":id")
    async updateService(
        @Param("tenantId") tenantId: string,
        @Param("id") id: string,
        @Body() data: any
    ) {
        return (this.prisma as any).service.update({
            where: { id: BigInt(id) },
            data: {
                ...data,
                price: data.price !== undefined ? Number(data.price) : undefined,
                durationMin: data.durationMin !== undefined ? Number(data.durationMin) : undefined
            }
        });
    }

    @Delete(":id")
    async deleteService(
        @Param("tenantId") tenantId: string,
        @Param("id") id: string
    ) {
        return (this.prisma as any).service.delete({
            where: { id: BigInt(id) }
        });
    }
}
