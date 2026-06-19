import { BrandIcon } from '@/components/shared/BrandIcon';
import {
  getReferenceBrand,
  getReferenceSourceLabel,
} from '@/lib/reference-source-label';
import { cn } from '@/lib/utils';

type ReferenceSourceLabelProps = {
  source?: string;
  imageUrl?: string;
  className?: string;
  iconClassName?: string;
};

export function ReferenceSourceLabel({
  source,
  imageUrl,
  className,
  iconClassName = 'h-3 w-3',
}: ReferenceSourceLabelProps) {
  const label = getReferenceSourceLabel(source, imageUrl);
  const brand = getReferenceBrand(source, imageUrl);

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      {brand ? <BrandIcon brand={brand} className={iconClassName} /> : null}
      {label}
    </span>
  );
}
