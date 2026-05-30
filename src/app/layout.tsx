import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Toast } from '@/components/shared/Toast';
import { CommandPalette } from '@/components/shared/CommandPalette';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
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
      <body className={`${inter.variable} ${playfair.variable} bg-slate-50 text-slate-950 antialiased`}>
        {children}
        <Toast />
        <CommandPalette />
      </body>
    </html>
  );
}