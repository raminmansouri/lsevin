"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import useAction from "@/hooks/use-action";
import { useRouter } from "@/i18n/navigation";

import { signUp } from "../../actions/sign-up";
import { SignUpSchema } from "../../actions/sign-up/schema";
import { InputType, TRANSLATION_KEY } from "../../actions/sign-up/types";
import AuthFormContainer from "../shared/auth-form-container";

export default function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo")?.trim() || "";
  const [isPending, startTransition] = useTransition();

  const t = useTranslations(TRANSLATION_KEY);

  const form = useForm<InputType>({
    resolver: zodResolver(SignUpSchema),
    mode: "onBlur",
    defaultValues: {
      firstName: "",
      lastName: "",
      userName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    },
  });

  const { execute } = useAction(signUp, {
    startTransition,
    onSuccess: (data) => {
      toast.success(t("messages.signUpSuccess"));
      // Registration triggers a phone-verification OTP on the backend. Send the
      // user to the OTP screen to confirm their number, mirroring the sign-in
      // verification flow. The number itself is not in the URL — the signUp
      // action parked it in an httpOnly cookie that the OTP page reads server
      // side, so `data` here only tells us that registration succeeded.
      if (data) {
        const otpPath = "/otp";
        router.push(redirectTo ? `${otpPath}?redirectTo=${encodeURIComponent(redirectTo)}` : otpPath);
      } else {
        router.push(redirectTo ? `/sign-in?redirectTo=${encodeURIComponent(redirectTo)}` : "/sign-in");
      }
    },
    onError: (error) => {
      toast.error(error.detail || t("messages.signUpError"));
    },
  });

  function onSubmit(values: InputType) {
    startTransition(async () => {
      execute(values);
    });
  }

  return (
    <ZodErrorProvider componentNamespace={TRANSLATION_KEY}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} autoComplete="off">
          <AuthFormContainer>
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.firstName.label")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("placeholders.firstName")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.lastName.label")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("placeholders.lastName")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.email.label")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("placeholders.email")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem className="flex flex-col items-start">
                  <FormLabel>{t("form.phoneNumber.label")}</FormLabel>
                  <FormControl className="w-full">
                    <PhoneInput
                      placeholder="9121111111"
                      {...field}
                      defaultCountry="IR"
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

            <Button className="w-full" type="submit" disabled={isPending}>
              {t("form.signUp")}
            </Button>
          </AuthFormContainer>
        </form>
      </Form>
    </ZodErrorProvider>
  );
}

export const SignUpFormSkeleton = () => {
  return (
    <AuthFormContainer>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex flex-col items-start gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="mt-4 h-10 w-full" />
    </AuthFormContainer>
  );
};
