"use client";

import { Control } from "react-hook-form";

import { RHFLazySearchableSelectField } from "@/features/admin-lazy-select";

/**
 * Use these replacements inside your service-definition form.
 * Keep normal text inputs, switches, and media pickers as they are.
 */
export function ServiceDefinitionFormLazySelectExamples({
  control,
  locale,
}: {
  control: Control<any>;
  locale: string;
}) {
  return (
    <>
      <RHFLazySearchableSelectField
        control={control}
        name="categoryId"
        label="Category"
        resource="category"
        locale={locale}
        required
        helperText="Searches category names in all translation values."
      />

      <RHFLazySearchableSelectField
        control={control}
        name="currency"
        label="Currency"
        resource="currency"
        locale={locale}
        required
      />

      {/* Use inside child rows for service attributes. */}
      <RHFLazySearchableSelectField
        control={control}
        name="attributeTypeId"
        label="Attribute type"
        resource="attribute-type"
        locale={locale}
        required
      />

      {/* Use inside staff/service assignment sections if this form includes them. */}
      <RHFLazySearchableSelectField
        control={control}
        name="serviceDefinitionId"
        label="Service definition"
        resource="service-definition"
        locale={locale}
        required
      />

      <RHFLazySearchableSelectField
        control={control}
        name="serviceProviderId"
        label="Service provider"
        resource="service-provider"
        locale={locale}
      />

      <RHFLazySearchableSelectField
        control={control}
        name="staffId"
        label="Staff"
        resource="staff"
        locale={locale}
      />
    </>
  );
}
