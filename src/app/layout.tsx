import type { Metadata } from 'next';
import { DM_Sans, Bodoni_Moda } from 'next/font/google';
import './globals.css';
import { Toast } from '@/components/shared/Toast';
import { CommandPalette } from '@/components/shared/CommandPalette';

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${dmSans.variable} ${bodoni.variable} antialiased`}>
        {children}
        <Toast />
        <CommandPalette />
      </body>
    </html>
  );
}