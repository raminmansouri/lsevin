'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/navigation';

import { deleteExchangeRateAction } from '../../actions/admin-currency-actions';

type ExchangeRateRowActionsProps = {
    id: string;
    pairLabel: string;
};

export function ExchangeRateRowActions({ id, pairLabel }: ExchangeRateRowActionsProps) {
    const t = useTranslations("AdminPages");
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [confirming, setConfirming] = useState(false);

    const handleDelete = () => {
        startTransition(async () => {
            try {
                await deleteExchangeRateAction(id);
                toast.success('Exchange rate deleted.');
                router.refresh();
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Failed to delete exchange rate.');
            } finally {
                setConfirming(false);
            }
        });
    };

    if (confirming) {
        return (
            <div className="flex items-center justify-end gap-2">
                <span className="text-xs text-muted-foreground">Delete {pairLabel}?</span>
                <Button
                    variant="destructive"
                    size="sm"
                    disabled={isPending}
                    onClick={handleDelete}
                >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yes, delete'}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => setConfirming(false)}
                >
                    Cancel
                </Button>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-end gap-2">
            <Button asChild variant="ghost" size="sm">
                <Link href={`/admin/finance/exchange-rates/${id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />{t("edit")}
                </Link>
            </Button>
            <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirming(true)}
            >
                <Trash2 className="mr-2 h-4 w-4" />Delete
            </Button>
        </div>
    );
}
