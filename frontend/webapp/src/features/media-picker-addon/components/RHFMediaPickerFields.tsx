"use client";

import React from "react";
import { Control, Controller, FieldPath, FieldValues } from "react-hook-form";

import type { MediaItem, UploadWithProgress } from "../types";
import MultiMediaPickerInput from "./MultiMediaPickerInput";
import SingleMediaPickerInput from "./SingleMediaPickerInput";

interface SharedProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  helperText?: string;
  modalTitle?: string;
  mediaType?: "all" | "image" | "video" | "file";
  uploadWith?: UploadWithProgress;
  /** Store the media_library "id" (for media_id FK columns) or the "fileUrl". Defaults to "fileUrl". */
  valueField?: "id" | "fileUrl";
}

export function RHFSingleMediaPickerField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  disabled,
  helperText,
  modalTitle,
  mediaType = "all",
  uploadWith,
  valueField,
}: SharedProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <SingleMediaPickerInput
          name={field.name}
          value={field.value ?? ""}
          onValueChange={field.onChange}
          label={label}
          placeholder={placeholder}
          disabled={disabled}
          helperText={helperText}
          modalTitle={modalTitle}
          mediaType={mediaType}
          uploadWith={uploadWith}
          valueField={valueField}
        />
      )}
    />
  );
}

export function RHFMultiMediaPickerField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  disabled,
  helperText,
  modalTitle,
  mediaType = "all",
  uploadWith,
}: SharedProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <MultiMediaPickerInput
          name={field.name}
          value={field.value ?? ""}
          onValueChange={field.onChange}
          label={label}
          placeholder={placeholder}
          disabled={disabled}
          helperText={helperText}
          modalTitle={modalTitle}
          mediaType={mediaType}
          uploadWith={uploadWith}
        />
      )}
    />
  );
}
