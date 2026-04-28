import { CurrencyForm } from '@/features/finance/components/admin/currency-form';

export default function NewCurrencyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create currency</h1>
        <p className="text-sm text-muted-foreground">Add a new display, payment, or settlement currency.</p>
      </div>
      <CurrencyForm />
    </div>
  );
}
