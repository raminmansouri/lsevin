"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod/v4";
import { ArrowLeft, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import useAction from "@/hooks/use-action";
import { Link, useRouter } from "@/i18n/navigation";
import { savePaymentGatewayAction } from "@/payment/admin/actions";
import { SavePaymentGatewaySchema } from "@/payment/admin/actions/save-payment-gateway/schema";
import type { InputType } from "@/payment/admin/actions/save-payment-gateway/types";
import type { PaymentGatewayConfig } from "@/payment/server/payment-gateway.repository";
import { useTranslations } from "next-intl";

export function PaymentGatewayForm({ gateway }: { gateway: PaymentGatewayConfig }) {
  const t = useTranslations("AdminGenerated");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // BTCPay is the crypto rail served to non-Iranian customers; it is configured
  // with a server/store/API key rather than a merchant id, and prices invoices
  // in a stable fiat unit because no BTC<->IRR rate exists.
  const isBtcPay = gateway.code === "btcpay";
  const defaultCurrency = (gateway.settings.currency || (isBtcPay ? "USD" : "IRR")) as
    | "IRR"
    | "IRT"
    | "USD"
    | "EUR";

  // Three generics, not one: `z.coerce` fields (minimumAmount, expirationMinutes)
  // accept unknown on the way in and produce a number on the way out, so the
  // form's field type and the resolver's result type genuinely differ. Typing
  // both ends separately is what lets `control` and `handleSubmit` line up.
  const form = useForm<z.input<typeof SavePaymentGatewaySchema>, unknown, InputType>({
    resolver: zodResolver(SavePaymentGatewaySchema),
    defaultValues: {
      code: gateway.code,
      displayName: gateway.displayName,
      description: gateway.description || "",
      isEnabled: gateway.isEnabled,
      supportsRefund: gateway.supportsRefund,
      sortOrder: gateway.sortOrder,
      settings: {
        merchantId: "",
        sandbox: gateway.settings.sandbox ?? true,
        currency: defaultCurrency,
        minimumAmount:
          gateway.settings.minimumAmount || (isBtcPay ? 1 : gateway.settings.currency === "IRT" ? 1000 : 10000),
        requestEndpoint: gateway.settings.requestEndpoint || "",
        verificationEndpoint: gateway.settings.verificationEndpoint || "",
        descriptionTemplate: gateway.settings.descriptionTemplate || "LSevin booking {{bookingId}}",
        enabledContexts: gateway.settings.enabledContexts?.length
          ? gateway.settings.enabledContexts
          : ["booking_online_card", "wallet_topup"],
        serverUrl: gateway.settings.serverUrl || "",
        storeId: gateway.settings.storeId || "",
        // Secrets arrive masked from the server; blank means "keep the current value".
        apiKey: "",
        webhookSecret: "",
        expirationMinutes: gateway.settings.expirationMinutes ?? 30,
      },
    },
  });

  const { execute } = useAction(savePaymentGatewayAction, {
    startTransition,
    onSuccess: () => {
      toast.success("Payment gateway settings saved.");
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
            <Link href="/admin/payment-gateways">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("backToGateways")}
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{gateway.displayName} settings</h1>
          <p className="text-sm text-muted-foreground">
            {t("configureTheGatewayUsedByBookingCheckoutAnd")}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("gatewayStatus")}</CardTitle>
              <CardDescription>{t("controlWhetherUsersCanStartPaymentsThroughThis")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="isEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-2xl border p-4">
                    <div>
                      <FormLabel>{t("enabled")}</FormLabel>
                      <FormDescription>{t("disabledGatewaysAreHiddenFromCheckoutAndCannot")}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isPending} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="settings.sandbox"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-2xl border p-4">
                    <div>
                      <FormLabel>{t("sandboxMode")}</FormLabel>
                      <FormDescription>{t("useZarinpalSandboxForDevelopmentAndTests")}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isPending} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("publicDisplay")}</CardTitle>
              <CardDescription>{t("adminFacingLabelsAndCheckoutDisplayValues")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("displayName")}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("sortOrder")}</FormLabel>
                    <FormControl>
                      {/* Coerced fields hold `unknown` until the resolver runs. */}
                      <Input {...field} value={String(field.value ?? "")} type="number" min={0} disabled={isPending} />
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
                    <FormLabel>{t("description")}</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} disabled={isPending} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>



          <Card>
            <CardHeader>
              <CardTitle>{t("whereThisGatewayAppears")}</CardTitle>
              <CardDescription>
                {t("zarinpalIsShownOnlyAfterTheUserChooses")}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="settings.enabledContexts"
                render={({ field }) => {
                  const values = Array.isArray(field.value) ? field.value : [];
                  const toggle = (context: "booking_online_card" | "wallet_topup", enabled: boolean) => {
                    const next = enabled
                      ? Array.from(new Set([...values, context]))
                      : values.filter((item) => item !== context);
                    field.onChange(next);
                  };

                  return (
                    <>
                      <FormItem className="flex items-center justify-between rounded-2xl border p-4">
                        <div>
                          <FormLabel>{t("bookingOnlineCardCheckout")}</FormLabel>
                          <FormDescription>
                            {t("showThisGatewayAfterTheCustomerSelectsOnline")}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={values.includes("booking_online_card")}
                            onCheckedChange={(checked) => toggle("booking_online_card", checked)}
                            disabled={isPending}
                          />
                        </FormControl>
                      </FormItem>

                      <FormItem className="flex items-center justify-between rounded-2xl border p-4">
                        <div>
                          <FormLabel>{t("walletTopUp")}</FormLabel>
                          <FormDescription>
                            {t("allowUsersToIncreaseWalletBalanceThroughThis")}
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={values.includes("wallet_topup")}
                            onCheckedChange={(checked) => toggle("wallet_topup", checked)}
                            disabled={isPending}
                          />
                        </FormControl>
                      </FormItem>
                    </>
                  );
                }}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{isBtcPay ? "BTCPay Server connection" : "Zarinpal credentials"}</CardTitle>
              <CardDescription>
                {isBtcPay
                  ? "Secrets are stored server-side and masked on read. Leave a secret blank to keep the existing value. Environment variables (BTCPAY_API_KEY, BTCPAY_WEBHOOK_SECRET) take precedence over anything set here."
                  : "Merchant ID is stored server-side. Leave it blank to keep the existing value."}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              {!isBtcPay && (
                <FormField
                  control={form.control}
                  name="settings.merchantId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("merchantId")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          type="password"
                          autoComplete="new-password"
                          placeholder={gateway.settings.merchantId ? `Current: ${gateway.settings.merchantId}` : "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormDescription>{t("leaveBlankToKeepTheCurrentMerchantId")}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {isBtcPay && (
                <>
                  <FormField
                    control={form.control}
                    name="settings.serverUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("serverUrl")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            placeholder={t("httpsPayLsevinCom")}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormDescription>{t("baseUrlOfYourSelfHostedBtcpayServer")}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="settings.storeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("storeId")}</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder={t("greenfieldStoreId")} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="settings.apiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("greenfieldApiKey")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            type="password"
                            autoComplete="new-password"
                            placeholder={gateway.settings.apiKey ? `Current: ${gateway.settings.apiKey}` : "Needs cancreateinvoice + canviewinvoices"}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormDescription>{t("leaveBlankToKeepTheCurrentKey")}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="settings.webhookSecret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("webhookSecret")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            type="password"
                            autoComplete="new-password"
                            placeholder={gateway.settings.webhookSecret ? `Current: ${gateway.settings.webhookSecret}` : "Shared secret from the BTCPay webhook"}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormDescription>
                          {t("mustMatchTheSecretOnTheBtcpayWebhook")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="settings.expirationMinutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("invoiceExpirationMinutes")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={String(field.value ?? 30)}
                            type="number"
                            min={1}
                            max={1440}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormDescription>{t("howLongTheCustomerHasToPayBefore")}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="settings.currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("paymentCurrency")}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("selectCurrency")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isBtcPay ? (
                          <>
                            <SelectItem value="USD">{t("usdUsDollar")}</SelectItem>
                            <SelectItem value="EUR">{t("eurEuro")}</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="IRR">{t("irrRial")}</SelectItem>
                            <SelectItem value="IRT">{t("irtToman")}</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {isBtcPay
                        ? "Invoices are priced in this fiat unit; BTCPay converts to BTC/Lightning/USDT at checkout."
                        : "Bookings in other currencies are converted before payment initiation."}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="settings.minimumAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("minimumAmount")}</FormLabel>
                    <FormControl>
                      <Input {...field} value={String(field.value ?? "")} type="number" min={1} disabled={isPending} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="settings.descriptionTemplate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("paymentDescriptionTemplate")}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isPending} />
                    </FormControl>
                    <FormDescription>Available tokens: {"{{bookingId}}"}, {"{{paymentId}}"}, {"{{providerName}}"}, {"{{serviceName}}"}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="settings.requestEndpoint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("customRequestEndpoint")}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder={t("optional")} disabled={isPending} />
                    </FormControl>
                    <FormDescription>{t("reservedForACustomProviderAdapterOrProxy")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="settings.verificationEndpoint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("customVerificationEndpoint")}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder={t("optional")} disabled={isPending} />
                    </FormControl>
                    <FormDescription>{t("reservedForACustomProviderAdapterOrProxy")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button asChild type="button" variant="outline">
              <Link href="/admin/payment-gateways">{t("cancel")}</Link>
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
