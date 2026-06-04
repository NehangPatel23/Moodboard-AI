'use client';

import { useEffect } from 'react';
import {
  readAppSettings,
  resolveThemeMode,
  subscribeAppSettings,
} from '@/lib/settings-store';

export function ThemeSync() {
  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      const settings = readAppSettings();
      const resolvedTheme = resolveThemeMode(settings.themeMode);

      root.classList.toggle('dark', resolvedTheme === 'dark');
      root.classList.toggle('reduce-motion', settings.reduceMotionEnabled);
      root.classList.toggle('strong-focus', settings.focusRingsEnabled);
      root.dataset.theme = settings.themeMode;
      root.style.colorScheme = resolvedTheme;
    };

    applyTheme();
    const unsubscribe = subscribeAppSettings(applyTheme);

    return () => {
      unsubscribe();
    };
  }, []);

  return null;
}