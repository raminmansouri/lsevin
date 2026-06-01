"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ZodErrorProvider } from "@/components/providers/zod-error-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { ICurrentUser } from "@/features/shared/types/user";
import useAction from "@/hooks/use-action";

import { updateBaseInfo } from "../actions/update-base-info";
import { UpdateBaseInfoSchema } from "../actions/update-base-info/schema";
import { InputType, TRANSLATION_KEY } from "../actions/update-base-info/types";

type Props = Pick<
  ICurrentUser,
  "firstName" | "lastName" | "email" | "phoneNumber" | "phoneNumberCountryCode"
>;

function formatLockedPhoneNumber(countryCode?: string | null, phone?: string | null) {
  const cleanCountryCode = (countryCode ?? "").trim();
  const cleanPhone = (phone ?? "").trim();
  const displayCountryCode = /^\d+$/.test(cleanCountryCode)
    ? `+${cleanCountryCode}`
    : cleanCountryCode;

  return [displayCountryCode, cleanPhone].filter(Boolean).join(" ");
}

export const UserBaseInfoForm = ({
  firstName,
  lastName,
  email,
  phoneNumber,
  phoneNumberCountryCode,
}: Props) => {
  const [isPending, startTransition] = useTransition();
  const { update: updateSession } = useSession();

  const t = useTranslations(TRANSLATION_KEY);
  const lockedPhoneNumber = formatLockedPhoneNumber(
    phoneNumberCountryCode,
    phoneNumber
  );

  const form = useForm<InputType>({
    resolver: zodResolver(UpdateBaseInfoSchema),
    mode: "onSubmit",
    defaultValues: {
      firstName: firstName || "",
      lastName: lastName || "",
      email: email || "",
    },
  });

  const { execute } = useAction(updateBaseInfo, {
    startTransition,
    onSuccess: async () => {
      toast.success(t("messages.updateSuccess"));
    },
    onError: (error) => {
      toast.error(error?.detail || t("errors.updateFailed"));
    },
  });

  function onSubmit(values: InputType) {
    startTransition(async () => {
      await execute(values);
      await updateSession();
    });
  }

  return (
    <ZodErrorProvider componentNamespace={TRANSLATION_KEY}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("personalInfo.base")}</CardTitle>
              <CardDescription>{t("page.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.firstName.label")}</FormLabel>
                      <FormControl>
                        <Input disabled={isPending} {...field} />
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
                        <Input disabled={isPending} {...field} />
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
                        <Input type="email" disabled={isPending} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                  <FormLabel>{t("form.phoneNumber.label")}</FormLabel>
                  <FormControl>
                    <Input
                      value={lockedPhoneNumber}
                      readOnly
                      disabled
                      className="cursor-not-allowed bg-muted text-muted-foreground"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    {t("edit.phoneLockedDescription")}
                  </p>
                </FormItem>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isPending} className="ml-auto">
                {t("buttons.save")}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </ZodErrorProvider>
  );
};

export const UserBaseInfoFormSkeleton = () => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="ml-auto h-10 w-24" />
      </CardFooter>
    </Card>
  );
};
