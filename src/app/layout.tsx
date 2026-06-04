import type { Metadata } from 'next';
import Script from 'next/script';
import { Bodoni_Moda, DM_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';
import { Toast } from '@/components/shared/Toast';
import { CommandPalette } from '@/components/shared/CommandPalette';
import { ThemeSync } from '@/components/shared/ThemeSync';
import { Analytics } from '@vercel/analytics/next';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

const bodoni = Bodoni_Moda({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'MoodBoard AI',
  description: 'AI-assisted moodboard and creative direction workspace.',
};

const themeInitScript = `
(function () {
  try {
    var storageKey = 'moodboard-settings-v1';
    var themeMode = 'system';
    var raw = window.localStorage.getItem(storageKey);

    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && (parsed.themeMode === 'light' || parsed.themeMode === 'dark' || parsed.themeMode === 'system')) {
        themeMode = parsed.themeMode;
      }
    }

    var resolvedTheme = themeMode;
    if (themeMode === 'system') {
      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    var root = document.documentElement;
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.dataset.theme = themeMode;
    root.style.colorScheme = resolvedTheme;
  } catch (error) {
    var root = document.documentElement;
    root.classList.remove('dark');
    root.dataset.theme = 'light';
    root.style.colorScheme = 'light';
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="scroll-smooth"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <body
        className={`${dmSans.variable} ${bodoni.variable} min-h-screen antialiased bg-(--background) text-(--text)`}
        suppressHydrationWarning
      >
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <ThemeSync />
        {children}
        <Analytics />
        <Toast />
        <CommandPalette />
      </body>
    </html>
  );
}