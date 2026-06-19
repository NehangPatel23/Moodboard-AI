'use client';

import { useId } from 'react';
import type { IconType } from 'react-icons';
import {
  SiNextdotjs,
  SiPexels,
  SiReact,
  SiSupabase,
  SiTailwindcss,
  SiTypescript,
  SiUnsplash,
  SiVercel,
} from 'react-icons/si';
import { cn } from '@/lib/utils';

export type BrandId =
  | 'nextjs'
  | 'react'
  | 'typescript'
  | 'tailwindcss'
  | 'supabase'
  | 'googlegemini'
  | 'pexels'
  | 'unsplash'
  | 'vercel';

/** Official Simple Icons path — rendered with Gemini brand gradient (not monochrome). */
const GEMINI_ICON_PATH =
  'M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81';

const MONOCHROME_BRANDS: BrandId[] = ['nextjs', 'vercel', 'unsplash'];

const BRAND_ICONS: Partial<Record<BrandId, IconType>> = {
  nextjs: SiNextdotjs,
  react: SiReact,
  typescript: SiTypescript,
  tailwindcss: SiTailwindcss,
  supabase: SiSupabase,
  pexels: SiPexels,
  unsplash: SiUnsplash,
  vercel: SiVercel,
};

/** Official Simple Icons brand colors where a fixed hue reads best. */
const BRAND_COLORS: Partial<Record<BrandId, string>> = {
  react: '#61DAFB',
  typescript: '#3178C6',
  tailwindcss: '#06B6D4',
  supabase: '#3FCF8E',
  pexels: '#05A081',
};

function GeminiGradientIcon({ className }: { className?: string }) {
  const gradientId = useId();

  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <defs>
        <radialGradient
          id={gradientId}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(6 6) rotate(45) scale(22)"
        >
          <stop stopColor="#9168C0" />
          <stop offset="0.26" stopColor="#5684D1" />
          <stop offset="0.51" stopColor="#1BA1E3" />
          <stop offset="0.76" stopColor="#54C89F" />
          <stop offset="1" stopColor="#FFCC5C" />
        </radialGradient>
      </defs>
      <path d={GEMINI_ICON_PATH} fill={`url(#${gradientId})`} />
    </svg>
  );
}

type BrandIconProps = {
  brand: BrandId;
  className?: string;
};

export function BrandIcon({ brand, className }: BrandIconProps) {
  if (brand === 'googlegemini') {
    return <GeminiGradientIcon className={className} />;
  }

  const Icon = BRAND_ICONS[brand];
  if (!Icon) return null;

  const color = BRAND_COLORS[brand];
  const monochrome = MONOCHROME_BRANDS.includes(brand);

  return (
    <Icon
      className={cn('shrink-0', monochrome && 'text-(--text-strong)', className)}
      style={color ? { color } : undefined}
      aria-hidden="true"
    />
  );
}

type BrandIconsProps = {
  brands: BrandId[];
  className?: string;
};

export function BrandIcons({ brands, className }: BrandIconsProps) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5">
      {brands.map((brand) => (
        <BrandIcon key={brand} brand={brand} className={className} />
      ))}
    </span>
  );
}
