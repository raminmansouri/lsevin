"use client";

import { useEffect, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { PasswordInput } from "@/components/form/password-input";
import { PhoneInput } from "@/components/form/phone-input";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import useAction from "@/hooks/use-action";
import { DEFAULT_SIGNIN_REDIRECT } from "@/lib/auth/routes";
import { ensureLocalePrefix } from "@/lib/utils";

import { authenticate } from "../../actions/sign-in";
import { SignInSchema } from "../../actions/sign-in/schema";
import { InputType, TRANSLATION_KEY } from "../../actions/sign-in/types";
import AuthFormContainer from "../shared/auth-form-container";

const SignInForm = () => {
  const [isPending, startTransition] = useTransition();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const searchParams = useSearchParams();
  const locale = useLocale();

  const t = useTranslations(TRANSLATION_KEY);

  const redirectTo = ensureLocalePrefix(
    searchParams.get("redirectTo") || DEFAULT_SIGNIN_REDIRECT,
    locale
  );

  const form = useForm<InputType>({
    resolver: zodResolver(SignInSchema),
    mode: "onSubmit",
    defaultValues: {
      userNameOrEmail: "",
      password: "",
      remember: false,
      redirectTo,
    },
  });

  const { execute } = useAction(authenticate, {
    startTransition,
    onSuccess: async () => {
      const DELAY = 1000;
      toast.success(t("messages.loginSuccess"), {
        duration: DELAY,
      });
      await new Promise((resolve) => setTimeout(resolve, DELAY));
      setShouldRedirect(true);
    },
  });

  useEffect(() => {
    if (shouldRedirect) {
      // Force page refresh to trigger NextAuth redirect
      window.location.href = redirectTo;
    }
  }, [shouldRedirect, redirectTo]);

  function onSubmit(values: InputType) {
    startTransition(async () => {
      execute(values);
    });
  }

  return (
    <ZodErrorProvider componentNamespace={TRANSLATION_KEY}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <AuthFormContainer>
            <FormField
              control={form.control}
              name="userNameOrEmail"
              render={({ field }) => (
                <FormItem className="flex flex-col items-start">
                  <FormLabel>{t("form.userNameOrEmail.label")}</FormLabel>
                  <FormControl className="w-full">
                    <PhoneInput
                      placeholder="9121111111"
                      {...field}
                      defaultCountry="IR"
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.password.label")}</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder="*******" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="remember"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between gap-2">
                  <FormLabel>{t("form.remember")}</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button disabled={isPending} className="mt-4 w-full" type="submit">
              {t("form.login")}
            </Button>
          </AuthFormContainer>
        </form>
      </Form>
    </ZodErrorProvider>
  );
};

export const SignInFormSkeleton = () => {
  return (
    <AuthFormContainer>
      <div className="flex flex-col items-start gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="flex flex-col items-start gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="flex flex-row items-center justify-between gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-5 w-10 rounded-full" />
      </div>

      <Skeleton className="mt-4 h-10 w-full" />
    </AuthFormContainer>
  );
};

export default SignInForm;
