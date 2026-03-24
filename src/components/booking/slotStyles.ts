import { TimeSlot } from '@/types/booking';

export function getSlotUnavailableClass(slot: TimeSlot): string {
    if (slot.available) return '';
    if (slot.bookedCount > 0) {
        return 'bg-red-500/18 text-red-800 dark:text-red-100 border border-red-500/45 shadow-[inset_0_0_0_1px_rgba(239,68,68,0.14)] cursor-not-allowed';
    }
    return 'opacity-25 cursor-not-allowed text-muted-foreground';
}