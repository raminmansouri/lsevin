"use client";


import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RHFSingleMediaPickerField } from "@/features/media-picker-addon";
import { useRouter } from "@/i18n/navigation";
import { saveIdentityUserAction } from "../actions/save-identity-user";

const schema = z.object({
  userId: z.guid().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  userName: z.string().min(1),
  email: z.email(),
  phoneNumberCountryCode: z.string().min(1),
  phoneNumber: z.string().min(1),
  userState: z.enum(["Active", "Locked"]),
  city: z.string().optional(),
  country: z.string().optional(),
  address: z.string().optional(),
  gender: z.string().optional(),
  profileImageUrl: z.string().optional(),
  emailConfirmed: z.boolean(),
  phoneNumberConfirmed: z.boolean(),
  twoFactorEnabled: z.boolean(),
});

type Values = z.infer<typeof schema>;

export function IdentityUserForm({ user }: { user?: any }) {
  const tAdmin = useTranslations("AdminGenerated");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      userId: user?.id,
      firstName: user?.first_name ?? '',
      lastName: user?.last_name ?? '',
      userName: user?.user_name ?? '',
      email: user?.email ?? '',
      phoneNumberCountryCode: user?.phone_number_country_code ?? '',
      phoneNumber: user?.phone_number ?? '',
      userState: user?.user_state === 'Locked' ? 'Locked' : 'Active',
      city: user?.city ?? '',
      country: user?.country ?? '',
      address: user?.address ?? '',
      gender: user?.gender ?? '',
      profileImageUrl: user?.profile_image_url ?? '',
      emailConfirmed: user?.email_confirmed ?? false,
      phoneNumberConfirmed: user?.phone_number_confirmed ?? false,
      twoFactorEnabled: user?.two_factor_enabled ?? false,
    },
  });

  return (
    <CardContent>
      <Form {...form}>
        <form className="space-y-6" onSubmit={form.handleSubmit((values) => startTransition(async () => {
          try { await saveIdentityUserAction(values); toast.success(tAdmin("identityUserSaved")); router.push('/admin/identity-users'); } catch (error: any) { toast.error(error?.message ?? 'Failed to save identity user'); }
        }))}>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField control={form.control} name="firstName" render={({ field }) => <FormItem><FormLabel>{tAdmin("firstName")}</FormLabel><FormControl><Input {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="lastName" render={({ field }) => <FormItem><FormLabel>{tAdmin("lastName")}</FormLabel><FormControl><Input {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="userName" render={({ field }) => <FormItem><FormLabel>{tAdmin("userName")}</FormLabel><FormControl><Input {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="email" render={({ field }) => <FormItem><FormLabel>{tAdmin("email")}</FormLabel><FormControl><Input {...field} type="email" disabled={isPending} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="phoneNumberCountryCode" render={({ field }) => <FormItem><FormLabel>{tAdmin("countryCode")}</FormLabel><FormControl><Input {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="phoneNumber" render={({ field }) => <FormItem><FormLabel>{tAdmin("phone")}</FormLabel><FormControl><Input {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="userState" render={({ field }) => (
              <FormItem>
                <FormLabel>وضعیت حساب</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="Active">فعال</SelectItem>
                    <SelectItem value="Locked">قفل‌شده</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <RHFSingleMediaPickerField control={form.control} name="profileImageUrl" label={tAdmin("profileImage")} placeholder={tAdmin("pickImage")} mediaType="image" helperText="Stores one media id in a hidden input." modalTitle="Pick profile image" />

          <div className="grid gap-4 md:grid-cols-3">
            <FormField control={form.control} name="emailConfirmed" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-md border p-3">
                <div className="space-y-0.5"><FormLabel>تأیید ایمیل</FormLabel><FormDescription className="text-xs">ایمیل تأییدشده است</FormDescription></div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={isPending} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="phoneNumberConfirmed" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-md border p-3">
                <div className="space-y-0.5"><FormLabel>تأیید موبایل</FormLabel><FormDescription className="text-xs">شماره تأییدشده است (لازمهٔ ورود)</FormDescription></div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={isPending} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="twoFactorEnabled" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-md border p-3">
                <div className="space-y-0.5"><FormLabel>احراز دومرحله‌ای</FormLabel><FormDescription className="text-xs">2FA فعال باشد</FormDescription></div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={isPending} /></FormControl>
              </FormItem>
            )} />
          </div>

          <div className="flex gap-3"><Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save user'}</Button><Button type="button" variant="outline" onClick={() => router.push('/admin/identity-users')} disabled={isPending}>Cancel</Button></div>
        </form>
      </Form>
    </CardContent>
  );
}
