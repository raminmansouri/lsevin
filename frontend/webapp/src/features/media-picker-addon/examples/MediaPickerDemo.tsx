"use client";

import React from "react";
import { useForm } from "react-hook-form";

import {
  RHFMultiMediaPickerField,
  RHFSingleMediaPickerField,
} from "../components/RHFMediaPickerFields";

type DemoFormValues = {
  thumbnail: string;
  brochureFiles: string;
};

export default function MediaPickerDemo() {
  const form = useForm<DemoFormValues>({
    defaultValues: {
      thumbnail: "",
      brochureFiles: "",
    },
  });

  return (
    <form
      className="mx-auto max-w-3xl space-y-6 p-6"
      onSubmit={form.handleSubmit((values) => {
        console.log("Submitted values:", values);
      })}
    >
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Media picker demo</h1>
        <p className="mt-1 text-sm text-slate-500">
          Hidden input values are stored as ids or comma-separated ids.
        </p>

        <div className="mt-6 grid gap-6">
          <RHFSingleMediaPickerField
            control={form.control}
            name="thumbnail"
            label="Thumbnail"
            placeholder="Pick image"
            mediaType="image"
            helperText="Stores one media id in a hidden input."
            modalTitle="Pick thumbnail"
          />

          <RHFMultiMediaPickerField
            control={form.control}
            name="brochureFiles"
            label="Brochures"
            placeholder="Pick files"
            mediaType="all"
            helperText="Stores ids as comma-separated text."
            modalTitle="Pick brochures"
          />
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          <div><strong>thumbnail</strong>: {form.watch("thumbnail") || "(empty)"}</div>
          <div className="mt-2"><strong>brochureFiles</strong>: {form.watch("brochureFiles") || "(empty)"}</div>
        </div>

        <button
          type="submit"
          className="mt-6 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white"
        >
          Submit
        </button>
      </div>
    </form>
  );
}
