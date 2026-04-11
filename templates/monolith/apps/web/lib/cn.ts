// `cn()` — the canonical shadcn/ui utility for merging class names.
//
// `clsx` handles conditional class composition (falsy values are dropped,
// arrays/objects are flattened). `tailwind-merge` then resolves Tailwind
// class *collisions* (e.g. `px-2` vs `px-4` — only the later one wins).
//
// Without tailwind-merge, you would end up with both classes in the DOM and
// rely on source order for precedence, which is brittle when composing
// variants. With it, the rightmost class always wins for any given utility
// bucket.

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
