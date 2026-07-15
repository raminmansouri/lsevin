"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { PasswordInput } from "@/components/form/password-input";
import { ZodErrorProvider } from "@/components/providers/zod-error-provider";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import useAction from "@/hooks/use-action";
import { useRouter } from "@/i18n/navigation";

import { resetPassword } from "../../actions/reset-password";
import { ResetPasswordSchema } from "../../actions/reset-password/schema";
import { InputType, TRANSLATION_KEY } from "../../actions/reset-password/types";
import AuthFormContainer from "../shared/auth-form-container";

const ResetPasswordForm = ({ identifier }: { identifier: string }) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const t = useTranslations(TRANSLATION_KEY);

  const form = useForm<InputType>({
    resolver: zodResolver(ResetPasswordSchema),
    mode: "onSubmit",
    defaultValues: {
      userNameOrEmail: identifier,
      code: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const { execute } = useAction(resetPassword, {
    startTransition,
    onSuccess: () => {
      toast.success(t("messages.success"));
      router.push("/sign-in");
    },
    onError: (error) => {
      toast.error(error.detail || error.title || t("messages.error"));
    },
  });

  async function onSubmit(values: InputType) {
    startTransition(async () => {
      execute({ ...values, userNameOrEmail: identifier });
    });
  }

  return (
    <ZodErrorProvider componentNamespace={TRANSLATION_KEY}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} autoComplete="off">
          <AuthFormContainer>
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem className="flex flex-col items-start">
                  <FormLabel>{t("form.code.label")}</FormLabel>
                  <FormControl className="w-full">
                    <Input
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="123456"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem className="flex flex-col items-start">
                  <FormLabel>{t("form.newPassword.label")}</FormLabel>
                  <FormControl className="w-full">
                    <PasswordInput placeholder="*******" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem className="flex flex-col items-start">
                  <FormLabel>{t("form.confirmPassword.label")}</FormLabel>
                  <FormControl className="w-full">
                    <PasswordInput placeholder="*******" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button disabled={isPending} className="mt-4 w-full" type="submit">
              {t("form.submit")}
            </Button>
          </AuthFormContainer>
        </form>
      </Form>
    </ZodErrorProvider>
  );
};

export const ResetPasswordFormSkeleton = () => {
  return (
    <AuthFormContainer>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex flex-col items-start gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="mt-4 h-10 w-full" />
    </AuthFormContainer>
  );
};

export default ResetPasswordForm;
