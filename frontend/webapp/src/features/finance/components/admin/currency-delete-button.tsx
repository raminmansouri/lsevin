'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/navigation';

import { deleteCurrencyAction } from '../../actions/admin-currency-actions';

export function CurrencyDeleteButton({ code }: { code: string }) {
  const tAdmin = useTranslations('AdminGenerated');
  const tTable = useTranslations('AdminTable');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const onConfirm = () => {
    startTransition(async () => {
      try {
        const result = await deleteCurrencyAction({ code });

        if (!result.ok) {
          // Name the tables the currency is still referenced from, so the admin
          // knows what to clear before retrying rather than just being refused.
          const places = (result.usedIn ?? []).map((key) => tTable(key)).join('، ');
          toast.error(`${tAdmin('currencyInUseCannotDelete')} ${places}`);
          return;
        }

        toast.success(tAdmin('currencyDeleted'));
        setOpen(false);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : tAdmin('failed'));
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" disabled={isPending} aria-label={tAdmin('deleteCurrency')}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{tAdmin('deleteCurrency')} — {code}</AlertDialogTitle>
          <AlertDialogDescription>{tAdmin('deleteCurrencyConfirm')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{tAdmin('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={(event) => {
              // Keep the dialog open so an "in use" refusal stays on screen.
              event.preventDefault();
              onConfirm();
            }}
          >
            {tAdmin('delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
