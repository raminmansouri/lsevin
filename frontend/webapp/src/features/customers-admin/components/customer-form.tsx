"use client";


import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RHFSingleMediaPickerField } from "@/features/media-picker-addon";
import { useRouter } from "@/i18n/navigation";
import { saveCustomerAction } from "../actions/save-customer";

const schema = z.object({
  customerId: z.guid().optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.email(),
  phoneNumberCountryCode: z.string().min(1),
  phoneNumber: z.string().min(1),
  city: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
  gender: z.string().optional(),
  isActive: z.boolean().default(true),
  profileImageUrl: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function CustomerForm({ customer }: { customer?: any }) {
  const tAdmin = useTranslations("AdminGenerated");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      customerId: customer?.id,
      firstName: customer?.first_name ?? '',
      lastName: customer?.last_name ?? '',
      email: customer?.email ?? '',
      phoneNumberCountryCode: customer?.phone_number_country_code ?? '',
      phoneNumber: customer?.phone_number ?? '',
      city: customer?.city ?? '',
      country: customer?.country ?? '',
      zipCode: customer?.zip_code ?? '',
      gender: customer?.gender ?? '',
      isActive: customer?.is_active ?? true,
      profileImageUrl: customer?.profile_image_url ?? '',
    },
  });

  return (
    <CardContent>
      <Form {...form}>
        <form className="space-y-6" onSubmit={form.handleSubmit((values) => startTransition(async () => {
          try { await saveCustomerAction(values); toast.success(tAdmin("customerSaved")); router.push('/admin/customers'); } catch (error: any) { toast.error(error?.message ?? 'Failed to save customer'); }
        }))}>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField control={form.control} name="firstName" render={({ field }) => <FormItem><FormLabel>{tAdmin("firstName")}</FormLabel><FormControl><Input {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="lastName" render={({ field }) => <FormItem><FormLabel>{tAdmin("lastName")}</FormLabel><FormControl><Input {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="email" render={({ field }) => <FormItem><FormLabel>{tAdmin("email")}</FormLabel><FormControl><Input {...field} type="email" disabled={isPending} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="phoneNumberCountryCode" render={({ field }) => <FormItem><FormLabel>{tAdmin("countryCode")}</FormLabel><FormControl><Input {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="phoneNumber" render={({ field }) => <FormItem><FormLabel>{tAdmin("phone")}</FormLabel><FormControl><Input {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="country" render={({ field }) => <FormItem><FormLabel>{tAdmin("country")}</FormLabel><FormControl><Input {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>} />
          </div>
          <RHFSingleMediaPickerField control={form.control} name="profileImageUrl" label={tAdmin("profileImage")} placeholder={tAdmin("pickImage")} mediaType="image" helperText="Stores one media id in a hidden input." modalTitle="Pick profile image" />
          <div className="flex gap-3"><Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save customer'}</Button><Button type="button" variant="outline" onClick={() => router.push('/admin/customers')} disabled={isPending}>Cancel</Button></div>
        </form>
      </Form>
    </CardContent>
  );
}
