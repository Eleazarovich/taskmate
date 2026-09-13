import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`skeleton ${className}`} />;
}

export function BoardSkeleton() {
  return (
    <div className="flex gap-4 p-6 overflow-x-auto">
      {['col-skel-1', 'col-skel-2', 'col-skel-3', 'col-skel-4', 'col-skel-5', 'col-skel-6'].map(colId => (
        <div key={colId} className="flex-shrink-0 w-72">
          <div className="mb-3">
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={`${colId}-card-${i}`} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}