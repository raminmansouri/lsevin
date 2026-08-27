"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod/v4";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import useAction from "@/hooks/use-action";
import { Link, useRouter } from "@/i18n/navigation";
import { savePaymentMethodAction } from "@/payment/admin/actions";
import { SavePaymentMethodSchema } from "@/payment/admin/actions/save-payment-method/schema";
import type { InputType } from "@/payment/admin/actions/save-payment-method/types";
import type { PaymentMethodConfig } from "@/payment/server/payment-method.repository";

function newBankAccountId() {
  return `acct-${Math.random().toString(36).slice(2, 10)}`;
}

export function PaymentMethodForm({ method }: { method: PaymentMethodConfig }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isBankReceipt = method.code === "bank_receipt";

  const form = useForm<z.input<typeof SavePaymentMethodSchema>, unknown, InputType>({
    resolver: zodResolver(SavePaymentMethodSchema),
    defaultValues: {
      code: method.code as "pay_on_delivery" | "bank_receipt",
      displayName: method.displayName,
      description: method.description || "",
      isActive: method.isActive,
      sortOrder: method.sortOrder,
      bankAccounts: method.configuration.bankAccounts?.length
        ? method.configuration.bankAccounts
        : isBankReceipt
          ? [{ id: newBankAccountId(), bankName: "", accountHolder: "", accountNumber: "", iban: "", cardNumber: "", note: "" }]
          : [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "bankAccounts" });

  const { execute } = useAction(savePaymentMethodAction, {
    startTransition,
    onSuccess: () => {
      toast.success("Payment method settings saved.");
      router.refresh();
    },
    onError: (error) => {
      toast.error(error?.detail || error?.title || "Settings could not be saved.");
    },
  });

  const onSubmit = (values: InputType) => {
    execute(values);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Button asChild variant="ghost" className="mb-2 px-0">
            <Link href="/admin/payment-methods">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to payment methods
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{method.displayName} settings</h1>
          <p className="text-sm text-muted-foreground">
            {isBankReceipt
              ? "Customers see these bank accounts when they choose to pay by receipt."
              : "Shown at checkout as a no-gateway payment option; the customer pays in cash when the service is delivered."}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>Control whether customers can select this payment method at checkout.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-2xl border p-4">
                    <div>
                      <FormLabel>Enabled</FormLabel>
                      <FormDescription>Disabled methods are hidden from checkout.</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isPending} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort order</FormLabel>
                    <FormControl>
                      <Input {...field} value={String(field.value ?? "")} type="number" min={0} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Public display</CardTitle>
              <CardDescription>Shown to customers at checkout.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} disabled={isPending} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {isBankReceipt && (
            <Card>
              <CardHeader>
                <CardTitle>Bank accounts</CardTitle>
                <CardDescription>
                  Customers see all of these accounts and upload a receipt after transferring to one of them. At least
                  one account is required to enable this method.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="rounded-2xl border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold">Account {index + 1}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isPending}
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`bankAccounts.${index}.bankName`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Bank name</FormLabel>
                            <FormControl>
                              <Input {...f} value={f.value || ""} placeholder="Bank Melli Iran" disabled={isPending} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`bankAccounts.${index}.accountHolder`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Account holder</FormLabel>
                            <FormControl>
                              <Input {...f} value={f.value || ""} disabled={isPending} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`bankAccounts.${index}.cardNumber`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Card number (کارت به کارت)</FormLabel>
                            <FormControl>
                              <Input {...f} value={f.value || ""} dir="ltr" placeholder="XXXX-XXXX-XXXX-XXXX" disabled={isPending} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`bankAccounts.${index}.iban`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Sheba / IBAN</FormLabel>
                            <FormControl>
                              <Input {...f} value={f.value || ""} dir="ltr" placeholder="IRxxxxxxxxxxxxxxxxxxxxxxxx" disabled={isPending} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`bankAccounts.${index}.accountNumber`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormLabel>Account number</FormLabel>
                            <FormControl>
                              <Input {...f} value={f.value || ""} dir="ltr" disabled={isPending} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`bankAccounts.${index}.note`}
                        render={({ field: f }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Note (optional)</FormLabel>
                            <FormControl>
                              <Input {...f} value={f.value || ""} placeholder="e.g. only transfer between 9am-6pm" disabled={isPending} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() =>
                    append({ id: newBankAccountId(), bankName: "", accountHolder: "", accountNumber: "", iban: "", cardNumber: "", note: "" })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add bank account
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-3">
            <Button asChild type="button" variant="outline">
              <Link href="/admin/payment-methods">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isPending}>
              <Save className="mr-2 h-4 w-4" />
              {isPending ? "Saving..." : "Save settings"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
