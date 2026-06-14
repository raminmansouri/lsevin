"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

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
import useAction from "@/hooks/use-action";
import { useRouter } from "@/i18n/navigation";

import { forgotPassword } from "../../actions/forgot-password";
import { ForgotPasswordSchema } from "../../actions/forgot-password/schema";
import {
  InputType,
  TRANSLATION_KEY,
} from "../../actions/forgot-password/types";
import AuthFormContainer from "../shared/auth-form-container";

const ForgotPasswordForm = () => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const t = useTranslations(TRANSLATION_KEY);

  const form = useForm<InputType>({
    resolver: zodResolver(ForgotPasswordSchema),
    mode: "onSubmit",
    defaultValues: {
      userNameOrEmail: "",
    },
  });

  const { execute } = useAction(forgotPassword, {
    startTransition,
    onSuccess: () => {
      toast.success(t("messages.success"));
      router.push("/sign-in");
    },
  });

  async function onSubmit(values: InputType) {
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
            <Button disabled={isPending} className="mt-4 w-full" type="submit">
              {t("form.submit")}
            </Button>
          </AuthFormContainer>
        </form>
      </Form>
    </ZodErrorProvider>
  );
};

export const ForgotPasswordFormSkeleton = () => {
  return (
    <AuthFormContainer>
      <div className="flex flex-col items-start gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="mt-4 h-10 w-full" />
    </AuthFormContainer>
  );
};

export default ForgotPasswordForm;
