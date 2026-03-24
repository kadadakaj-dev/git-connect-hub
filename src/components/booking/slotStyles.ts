import { TimeSlot } from '@/types/booking';

export function getSlotUnavailableClass(slot: TimeSlot): string {
    if (slot.available) return '';
    if (slot.bookedCount > 0) {
        return 'bg-red-500/12 text-red-700 dark:text-red-200 border border-red-400/35 shadow-[inset_0_0_0_1px_rgba(248,113,113,0.08)] cursor-not-allowed';
    }
    return 'opacity-25 cursor-not-allowed text-muted-foreground';
}