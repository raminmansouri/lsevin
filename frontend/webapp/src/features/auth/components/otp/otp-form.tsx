"use client";

import { useEffect, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Skeleton } from "@/components/ui/skeleton";
import useAction from "@/hooks/use-action";
import { useRouter } from "@/i18n/navigation";

import { resendOtp } from "../../actions/resend-otp";
import { TRANSLATION_KEY } from "../../actions/resend-otp/types";
import { verifyOtp } from "../../actions/verify-otp";
import { VerifyOtpSchema } from "../../actions/verify-otp/schema";
import { InputType } from "../../actions/verify-otp/types";
import AuthFormContainer from "../shared/auth-form-container";

type Props = {
  phoneNumber: string;
  redirectTo?: string;
};

const RESEND_TIME = 60; // 1 minute in seconds

const OtpForm = ({ phoneNumber, redirectTo }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [remainingTime, setRemainingTime] = useState(RESEND_TIME);

  const t = useTranslations(TRANSLATION_KEY);

  const form = useForm<InputType>({
    resolver: zodResolver(VerifyOtpSchema),
    defaultValues: {
      code: "",
      phoneNumber,
    },
  });

  const { execute: executeVerify } = useAction(verifyOtp, {
    startTransition,
    onSuccess: () => {
      toast.success(t("messages.success"));
      router.push(redirectTo || "/");
    },
    onError: (err) => {
      toast.error(err.detail || t("messages.error"));
    },
  });

  const { execute: executeResend } = useAction(resendOtp, {
    startTransition,
    onSuccess: () => {
      toast.success(t("messages.resendSuccess"));
      setRemainingTime(RESEND_TIME);
    },
    onError: (error) => {
      toast.error(error.detail || t("messages.resendError"));
    },
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  async function onSubmit(values: InputType) {
    startTransition(async () => {
      executeVerify({ ...values, redirectTo });
    });
  }

  const handleOtpComplete = (value: string) => {
    if (!isPending) {
      form.setValue("code", value);
      form.handleSubmit(onSubmit)();
    }
  };

  const handleResendCode = async () => {
    if (remainingTime > 0) return;
    startTransition(async () => {
      executeResend({ phoneNumber });
    });
  };

  return (
    <ZodErrorProvider componentNamespace={TRANSLATION_KEY}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <AuthFormContainer className="gap-8">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem
                  dir="ltr"
                  className="flex flex-col items-center justify-center"
                >
                  <FormLabel className="mb-2">{t("form.code.label")}</FormLabel>
                  <FormControl>
                    <InputOTP
                      autoFocus
                      maxLength={6}
                      {...field}
                      onComplete={handleOtpComplete}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="link"
                className="px-0 text-sm"
                disabled={remainingTime > 0 || isPending}
                onClick={handleResendCode}
              >
                {remainingTime > 0
                  ? t("form.resendCodeTimer", {
                      time: formatTime(remainingTime),
                    })
                  : t("form.resendCode")}
              </Button>
              <Button disabled={isPending} type="submit">
                {t("form.verify")}
              </Button>
            </div>
          </AuthFormContainer>
        </form>
      </Form>
    </ZodErrorProvider>
  );
};

export const OtpFormSkeleton = () => {
  return (
    <AuthFormContainer className="gap-8">
      <div
        dir="ltr"
        className="flex flex-col items-center justify-center gap-2"
      >
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="size-10" />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-20" />
      </div>
    </AuthFormContainer>
  );
};

export default OtpForm;
