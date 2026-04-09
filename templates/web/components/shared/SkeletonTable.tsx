// SkeletonTable — placeholder for tabular data. Renders a fixed number of
// rows with alternating widths so the pulse animation reads as "loading rows"
// rather than "empty state".
//
// Pass `rowCount` to match the expected page size of the table this is
// standing in for.

import { Skeleton } from '@/components/ui/Skeleton';

export interface SkeletonTableProps {
  rowCount?: number;
}

export function SkeletonTable({ rowCount = 5 }: SkeletonTableProps) {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-live="polite">
      <Skeleton className="h-8 w-full" />
      {Array.from({ length: rowCount }, (_unused, index) => (
        <Skeleton
          // Index is stable for the lifetime of this render — there is no
          // other identity to key on in a placeholder.
          key={index}
          className={index % 2 === 0 ? 'h-10 w-full' : 'h-10 w-11/12'}
        />
      ))}
    </div>
  );
}
