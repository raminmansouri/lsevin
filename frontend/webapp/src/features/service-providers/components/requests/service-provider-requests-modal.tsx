"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { ZodErrorProvider } from "@/components/providers/zod-error-provider";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import useAction from "@/hooks/use-action";

import { addServiceProviderRequest } from "../../actions/add-service-provider-request";
import { AddServiceProviderRequestSchema } from "../../actions/add-service-provider-request/schema";
import { InputType } from "../../actions/add-service-provider-request/types";
import { IServiceProviderRequest } from "../../types";
import { REQUESTS_TRANSLATION_KEY } from "../../types/constants";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceProviderId: string;
  myRequests: IServiceProviderRequest[];
};

export function ServiceProviderRequestsModal({
  open,
  onOpenChange,
  serviceProviderId,
  myRequests,
}: Props) {
  const t = useTranslations(REQUESTS_TRANSLATION_KEY);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<InputType>({
    resolver: zodResolver(AddServiceProviderRequestSchema),
    defaultValues: {
      serviceProviderId,
      message: "",
    },
  });

  const { execute } = useAction(addServiceProviderRequest, {
    startTransition,
    onSuccess: () => {
      form.reset({ serviceProviderId, message: "" });
      onOpenChange(false);
      router.refresh();
    },
  });

  function onSubmit(values: InputType) {
    startTransition(async () => {
      execute(values);
    });
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("formTitle")}
    >
      <div className="flex flex-col gap-4 py-4">
        <ZodErrorProvider componentNamespace={REQUESTS_TRANSLATION_KEY}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.message.label")}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        disabled={isPending}
                        placeholder={t("form.message.placeholder")}
                        className="min-h-32"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={isPending}>
                  {t("submit")}
                </Button>
              </div>
            </form>
          </Form>
        </ZodErrorProvider>

        {myRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("myRequests")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {myRequests.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-md border-b py-2 text-sm last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{r.status}</span>
                      <span className="text-muted-foreground">
                        {new Date(r.createDate).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-1">{r.message}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ResponsiveModal>
  );
}
