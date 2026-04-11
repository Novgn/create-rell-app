// Dashboard route-level loading UI (Story 4.3).
//
// Next.js renders this file automatically while any server data fetch inside
// the (dashboard) route segment is streaming. The skeleton composition should
// approximate the real page layout — dashboard landing uses a card-style
// layout, so we render a few SkeletonCards.

import { SkeletonCard } from '@/components/shared/SkeletonCard';

export default function DashboardLoading() {
  return (
    <main className="flex flex-col gap-4 p-6" aria-label="Loading dashboard">
      <SkeletonCard />
      <SkeletonCard />
    </main>
  );
}
