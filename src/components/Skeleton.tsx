interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, className = '' }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <Skeleton height={12} width="40%" />
      <Skeleton height={28} width="60%" className="skeleton--mt" />
      <Skeleton height={10} width="80%" className="skeleton--mt" />
    </div>
  );
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="skeleton-grid" aria-label="Loading...">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="skeleton-layout" aria-label="Loading analytics...">
      <div className="skeleton-layout__row">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <Skeleton height={200} borderRadius={12} className="skeleton-layout__chart" />
      <Skeleton height={200} borderRadius={12} className="skeleton-layout__chart" />
    </div>
  );
}

export function VocabularySkeleton() {
  return (
    <div className="skeleton-layout" aria-label="Loading vocabulary...">
      <Skeleton height={40} width="60%" borderRadius={8} />
      <div className="skeleton-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="skeleton-layout" aria-label="Loading profile...">
      <Skeleton height={20} width="50%" borderRadius={8} />
      <Skeleton height={12} width="100%" borderRadius={6} />
      <div className="skeleton-layout__row">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
