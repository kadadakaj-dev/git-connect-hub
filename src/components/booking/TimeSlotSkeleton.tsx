import { Skeleton } from '@/components/ui/skeleton';

const TimeSlotSkeleton = () => {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
        <Skeleton
          key={i}
          className="h-11 sm:h-12 rounded-xl animate-fade-in-up"
          style={{ animationDelay: `${i * 50}ms` }}
        />
      ))}
    </div>
  );
};

export default TimeSlotSkeleton;
