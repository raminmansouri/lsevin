'use client';

import { Link } from '@/i18n/navigation';

export function ReserveButton({
  href,
  label,
  className,
}: {
  href?: string;
  label: string;
  className?: string;
}) {
  // A package not linked to a service has nothing to reserve yet.
  if (!href) return null;
  return (
    <Link
      href={href}
      onClick={(event) => event.stopPropagation()}
      className={`relative z-10 ${className ?? ""}`}
    >
      {label}
    </Link>
  );
}