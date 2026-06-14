'use client';

import { Heart } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { cn } from '@/lib/utils';

import { toggleFavoriteAction } from '../actions/favorite-actions';
import type { FavoriteEntityType } from '../types';

export function FavoriteButton({
  entityId,
  entityType,
  initialIsFavorite = false,
  ariaLabel,
  className,
  iconClassName,
  activeClassName = 'text-red-500',
  inactiveClassName = 'text-gray-900',
  disabled,
  loginHref,
  onAuthRequired,
  onChange,
}: {
  entityId: string;
  entityType: FavoriteEntityType;
  initialIsFavorite?: boolean;
  ariaLabel?: string;
  className?: string;
  iconClassName?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  disabled?: boolean;
  loginHref?: string;
  onAuthRequired?: () => void;
  onChange?: (isFavorite: boolean) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);

  useEffect(() => {
    setIsFavorite(initialIsFavorite);
  }, [initialIsFavorite]);

  const handleClick = () => {
    if (disabled || isPending) return;

    const previousValue = isFavorite;
    const nextValue = !previousValue;
    setIsFavorite(nextValue);
    onChange?.(nextValue);

    startTransition(async () => {
      const result = await toggleFavoriteAction({
        entityId,
        entityType,
        revalidatePathname: pathname,
      });

      if (result.requiresAuth) {
        setIsFavorite(previousValue);
        onChange?.(previousValue);

        if (onAuthRequired) {
          onAuthRequired();
          return;
        }

        if (loginHref) {
          router.push(loginHref);
          return;
        }

        window.dispatchEvent(
          new CustomEvent('lsevin:auth-required', {
            detail: { reason: 'favorite', entityId, entityType },
          })
        );
        return;
      }

      if (!result.ok) {
        setIsFavorite(previousValue);
        onChange?.(previousValue);
        return;
      }

      setIsFavorite(result.isFavorite);
      onChange?.(result.isFavorite);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isPending}
      aria-pressed={isFavorite}
      aria-label={ariaLabel || (isFavorite ? 'Remove from favorites' : 'Add to favorites')}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-lg backdrop-blur-sm transition-transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60',
        isFavorite ? activeClassName : inactiveClassName,
        className
      )}
    >
      <Heart size={20} className={iconClassName} fill={isFavorite ? 'currentColor' : 'none'} />
    </button>
  );
}
