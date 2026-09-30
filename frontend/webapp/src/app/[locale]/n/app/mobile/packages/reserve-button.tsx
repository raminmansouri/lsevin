'use client';

import { Link } from '@/i18n/navigation';

export function ReserveButton({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      onClick={(event) => event.stopPropagation()}
      className={className}
    >
      {label}
    </Link>
  );
}