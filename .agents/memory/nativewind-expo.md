---
name: NativeWind Expo setup
description: NativeWind 4.2 with Expo 57 requires explicit runtime and class-based dark mode in this pnpm workspace.
---

NativeWind 4.2 should be configured with its Tailwind preset, class-based dark mode, and the `nativewind/babel` entry as a preset. In this pnpm Expo workspace, `react-native-css-interop` must also be a direct mobile-package dependency so Metro can resolve the transformed JSX runtime.

**Why:** Without the preset, Metro rejects the Tailwind config; without the direct runtime dependency, web bundling cannot resolve `react-native-css-interop/jsx-runtime`; media dark mode conflicts with manually selected dark mode.

**How to apply:** Keep `darkMode: 'class'`, use `withNativeWind` in Metro, and verify the Expo web bundle after dependency or Babel changes.