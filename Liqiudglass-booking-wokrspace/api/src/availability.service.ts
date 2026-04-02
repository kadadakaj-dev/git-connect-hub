import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { AvailabilitySlot } from "@bookinggg/core";

@Injectable()
export class AvailabilityService {
    constructor(private readonly prisma: PrismaService) { }

    async getAvailableSlots(
        tenantId: string,
        date: string,
        serviceId: string
    ): Promise<AvailabilitySlot[]> {
        const service = await (this.prisma as any).service.findUnique({
            where: { id: BigInt(serviceId) }
        });
        if (!service) throw new Error("Service not found");

        const settings = await (this.prisma as any).businessSettings.findFirst();
        if (!settings) throw new Error("Business settings not found");

        const openingHours = settings.openingHoursJson as any;

        // Use a fixed locale and timezone for deterministic weekday calculation
        const formatter = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "Europe/Bratislava" });
        const dayOfWeek = formatter.format(new Date(date)).toLowerCase();
        const dayHours = openingHours[dayOfWeek];

        if (!dayHours || dayHours.closed) return [];

        const existingBookings = await (this.prisma as any).booking.findMany({
            where: {
                startTime: {
                    gte: new Date(`${date}T00:00:00Z`),
                    lte: new Date(`${date}T23:59:59Z`)
                },
                status: { not: "cancelled" }
            }
        });

        const slots: AvailabilitySlot[] = [];
        const [startH, startM] = dayHours.open.split(":").map(Number);
        const [endH, endM] = dayHours.close.split(":").map(Number);

        let current = new Date(date);
        current.setUTCHours(startH, startM, 0, 0);

        const end = new Date(date);
        end.setUTCHours(endH, endM, 0, 0);

        while (current.getTime() + service.durationMin * 60000 <= end.getTime()) {
            const slotEnd = new Date(current.getTime() + service.durationMin * 60000);

            const isOverlap = existingBookings.some((b: any) => {
                const bStart = b.startTime.getTime();
                const bEnd = b.endTime.getTime();
                const sStart = current.getTime();
                const sEnd = slotEnd.getTime();
                return (sStart < bEnd && sEnd > bStart);
            });

            if (!isOverlap) {
                slots.push({
                    startAt: current.toISOString(),
                    endAt: slotEnd.toISOString(),
                    serviceId
                });
            }

            current = new Date(current.getTime() + 15 * 60000); // 15 min granularity
        }

        return slots;
    }

    async validateBooking(
        startTime: string,
        endTime: string,
        serviceId: string
    ): Promise<boolean> {
        const sStart = new Date(startTime).getTime();
        const sEnd = new Date(endTime).getTime();
        const actualDuration = (sEnd - sStart) / 60000;

        // 1. Service Check
        const service = await (this.prisma as any).service.findUnique({
            where: { id: BigInt(serviceId) }
        });
        if (!service || actualDuration !== service.durationMin) {
            return false;
        }

        // 2. Business Hours Check
        const settings = await (this.prisma as any).businessSettings.findFirst();
        if (settings) {
            const openingHours = settings.openingHoursJson as any;
            const formatter = new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "Europe/Bratislava" });
            const dayOfWeek = formatter.format(new Date(startTime)).toLowerCase();
            const dayHours = openingHours[dayOfWeek];

            if (!dayHours || dayHours.closed) return false;

            const [startH, startM] = dayHours.open.split(":").map(Number);
            const [endH, endM] = dayHours.close.split(":").map(Number);

            const dayStart = new Date(startTime);
            dayStart.setUTCHours(startH, startM, 0, 0);
            const dayEnd = new Date(startTime);
            dayEnd.setUTCHours(endH, endM, 0, 0);

            if (sStart < dayStart.getTime() || sEnd > dayEnd.getTime()) {
                return false;
            }
        }

        // 3. Overlap Check
        const overlaps = await (this.prisma as any).booking.findMany({
            where: {
                AND: [
                    { startTime: { lt: new Date(endTime) } },
                    { endTime: { gt: new Date(startTime) } },
                    { status: { not: "cancelled" } }
                ]
            }
        });

        return overlaps.length === 0;
    }
}
