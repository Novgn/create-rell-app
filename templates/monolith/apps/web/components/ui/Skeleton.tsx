// Minimal shadcn-style Skeleton (Story 4.3).
//
// A neutral pulsing placeholder block. Domain-specific skeletons in
// `components/shared/` (SkeletonCard, SkeletonTable) compose this primitive
// to match real content layout.

import type { HTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-neutral-200', className)}
      aria-hidden="true"
      {...props}
    />
  );
}
