'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Switch } from '@/components/ui/switch';
import { useRouter } from '@/i18n/navigation';

import { toggleCurrencyActiveAction } from '../../actions/admin-currency-actions';

/**
 * The Active column used to be a read-only badge, so toggleCurrencyActiveAction
 * had no caller and a currency could only be activated by opening the edit form.
 */
export function CurrencyActiveToggle({ code, isActive }: { code: string; isActive: boolean }) {
  const tAdmin = useTranslations('AdminGenerated');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={isActive}
        disabled={isPending}
        aria-label={tAdmin('status')}
        onCheckedChange={(next) => {
          startTransition(async () => {
            try {
              await toggleCurrencyActiveAction(code, next);
              router.refresh();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : tAdmin('failed'));
            }
          });
        }}
      />
      <span className="text-xs text-muted-foreground">
        {isActive ? tAdmin('active') : tAdmin('inactive')}
      </span>
    </div>
  );
}
