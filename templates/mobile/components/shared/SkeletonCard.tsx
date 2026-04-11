// @ts-nocheck -- template-only; the scaffold engine strips this line before writing to user projects so scaffolded output has normal TypeScript checking.
// Mobile SkeletonCard — NativeWind-styled placeholder matching a card layout.
//
// Uses `className` on RN primitives (enabled by the NativeWind Babel preset
// + `nativewind-env.d.ts`). A single opacity value stands in for a real
// animation — add a `react-native-reanimated` loop if you want the pulse
// effect, or drop in `moti` / `react-native-skeleton-placeholder`.

import { View } from 'react-native';

export function SkeletonCard() {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      className="gap-2 rounded-lg border border-neutral-200 bg-white p-4"
    >
      <View className="h-5 w-1/3 rounded bg-neutral-200 opacity-70" />
      <View className="h-4 w-1/2 rounded bg-neutral-200 opacity-60" />
      <View className="mt-2 h-4 w-full rounded bg-neutral-200 opacity-60" />
      <View className="h-4 w-11/12 rounded bg-neutral-200 opacity-60" />
      <View className="h-4 w-10/12 rounded bg-neutral-200 opacity-60" />
    </View>
  );
}
