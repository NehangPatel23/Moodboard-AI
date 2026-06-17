import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Changelog · MoodBoard AI',
  description: 'Product updates and shipped improvements for MoodBoard AI.',
};

export default function ChangelogLayout({ children }: { children: ReactNode }) {
  return children;
}
