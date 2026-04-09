// SkeletonCard — domain-specific skeleton matching the Card + Header + Content
// layout. Use this from `loading.tsx` or inside suspense boundaries for
// per-card placeholder UI.
//
// Per architecture: skeletons must *match* the layout of the content they
// replace. This one mirrors the Card primitive in components/ui/Card.tsx.

import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

export function SkeletonCard() {
  return (
    <Card aria-busy="true" aria-live="polite">
      <CardHeader>
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-10/12" />
      </CardContent>
    </Card>
  );
}
