import { Skeleton } from '@/components/ui/skeleton';

const ServiceSkeleton = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="glass-card p-4 sm:p-5 rounded-2xl animate-fade-in-up"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          {/* Category Badge Skeleton */}
          <Skeleton className="h-6 w-24 rounded-full mb-3" />
          
          {/* Icon Skeleton */}
          <Skeleton className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl mb-3 sm:mb-4" />
          
          {/* Title Skeleton */}
          <Skeleton className="h-5 sm:h-6 w-3/4 mb-2" />
          
          {/* Description Skeleton */}
          <div className="space-y-1.5 mb-3 sm:mb-4">
            <Skeleton className="h-3 sm:h-4 w-full" />
            <Skeleton className="h-3 sm:h-4 w-2/3" />
          </div>
          
          {/* Duration & Price Skeleton */}
          <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-border/40">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default ServiceSkeleton;
