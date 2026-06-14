"use client";

import { useForm, Controller } from "react-hook-form";

import { uploadMediaUsingServerActionExample } from "../examples/use-server-action-upload-handler.example";
import {
  GalleryPickerField,
  SingleFilePickerField,
  SingleImagePickerField,
  SingleVideoPickerField,
} from "../components/MediaField";
import { GalleryPickerItem, MediaPickerValue } from "../types";

type ExampleFormValues = {
  thumbnail: MediaPickerValue | null;
  introVideo: MediaPickerValue | null;
  brochure: MediaPickerValue | null;
  gallery: GalleryPickerItem[];
};

export function ExampleMediaForm() {
  const form = useForm<ExampleFormValues>({
    defaultValues: {
      thumbnail: null,
      introVideo: null,
      brochure: null,
      gallery: [],
    },
  });

  const values = form.watch();

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <div>
        <div className="text-2xl font-semibold text-slate-950">
          Example media-enabled form
        </div>
        <div className="mt-1 text-sm text-slate-500">
          This shows Controller-based integration for image, video, file, and gallery fields.
        </div>
      </div>

      <form
        onSubmit={form.handleSubmit((data) => {
          console.log("Submitted values", data);
        })}
        className="grid gap-8"
      >
        <Controller
          control={form.control}
          name="thumbnail"
          render={({ field }) => (
            <SingleImagePickerField
              label="Thumbnail"
              hint="Single image picker for fields like thumbnail or coverImage."
              value={field.value}
              onChange={field.onChange}
              uploadHandler={uploadMediaUsingServerActionExample}
            />
          )}
        />

        <Controller
          control={form.control}
          name="introVideo"
          render={({ field }) => (
            <SingleVideoPickerField
              label="Intro video"
              hint="Single video picker for fields like introVideo."
              value={field.value}
              onChange={field.onChange}
              uploadHandler={uploadMediaUsingServerActionExample}
            />
          )}
        />

        <Controller
          control={form.control}
          name="brochure"
          render={({ field }) => (
            <SingleFilePickerField
              label="Brochure"
              hint="Single file picker for PDFs or generic downloadable files."
              value={field.value}
              onChange={field.onChange}
              uploadHandler={uploadMediaUsingServerActionExample}
            />
          )}
        />

        <Controller
          control={form.control}
          name="gallery"
          render={({ field }) => (
            <GalleryPickerField
              label="Gallery"
              hint="Multi-image selection with ordering, primary item, and localized per-item metadata."
              value={field.value}
              onChange={field.onChange}
              maxSelectionCount={20}
              uploadHandler={uploadMediaUsingServerActionExample}
            />
          )}
        />

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Submit example form
          </button>
          <button
            type="button"
            onClick={() => form.reset()}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300"
          >
            Reset
          </button>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
          <div className="mb-3 text-sm font-semibold text-slate-900">
            Current form value
          </div>
          <pre className="overflow-x-auto text-xs text-slate-700">
            {JSON.stringify(values, null, 2)}
          </pre>
        </div>
      </form>
    </div>
  );
}
