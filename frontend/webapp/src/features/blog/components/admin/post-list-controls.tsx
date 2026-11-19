"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { LOCALE_DISPLAY_NAMES, SUPPORTED_LOCALE_HEADERS } from "@/config/locales";
import { useRouter } from "@/i18n/navigation";

import { createPostAction, deletePostAction } from "../../actions";
import type { BlogActionFailure } from "../../actions/result";
import { Field, TextInput } from "./block-editors";

/** "New post": a title, a URL name and the first language. Creates a draft and opens the editor. */
export function NewPostForm({ defaultLocaleKey }: { defaultLocaleKey: string }) {
  const t = useTranslations("AdminBlog");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [localeKey, setLocaleKey] = useState(defaultLocaleKey);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  // A Latin title suggests its own URL name; a Persian one cannot, so the editor types it.
  const suggest = (value: string) =>
    /^[\x20-\x7e]+$/u.test(value)
      ? value
          .toLowerCase()
          .replace(/[^a-z0-9]+/gu, "-")
          .replace(/^-+|-+$/gu, "")
          .slice(0, 80)
      : "";

  const submit = () => {
    setErrors({});
    startTransition(async () => {
      let result;
      try {
        result = await createPostAction({ slug, title, localeKey });
      } catch (error) {
        console.error("create post failed", error);
        toast.error(t("toast.failed"));
        return;
      }
      if (result.ok) {
        toast.success(t("toast.created"));
        router.push(`/admin/blog/${(result as { ok: true; data: { id: string } }).data.id}?locale=${encodeURIComponent(localeKey)}`);
        return;
      }
      const failure = result as BlogActionFailure;
      setErrors(failure.fieldErrors ?? {});
      toast.error(failure.code === "FAILED" ? t("toast.failed") : failure.message);
    });
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm text-primary-foreground" data-testid="new-post">
        <Plus className="size-4" aria-hidden />
        {t("newPost")}
      </button>
    );
  }
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="w-full space-y-3 rounded-2xl border bg-card p-4 sm:w-[28rem]"
      data-testid="new-post-form"
    >
      <Field label={t("postTitle")} error={errors.title}>
        {(id) => (
          <TextInput
            id={id}
            value={title}
            maxLength={200}
            testId="new-post-title"
            onChange={(value) => {
              setTitle(value);
              if (!slugTouched) setSlug(suggest(value));
            }}
          />
        )}
      </Field>
      <Field label={t("settings.slug")} hint={t("settings.slugHint")} error={errors.slug}>
        {(id) => (
          <TextInput
            id={id}
            value={slug}
            dir="ltr"
            maxLength={120}
            testId="new-post-slug"
            onChange={(value) => {
              setSlugTouched(true);
              setSlug(value.toLowerCase());
            }}
          />
        )}
      </Field>
      <Field label={t("firstLanguage")}>
        {(id) => (
          <select id={id} value={localeKey} onChange={(event) => setLocaleKey(event.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm" data-testid="new-post-language">
            {SUPPORTED_LOCALE_HEADERS.map((key) => (
              <option key={key} value={key}>
                {LOCALE_DISPLAY_NAMES[key]}
              </option>
            ))}
          </select>
        )}
      </Field>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="h-9 rounded-md bg-primary px-4 text-sm text-primary-foreground disabled:opacity-50" data-testid="new-post-submit">
          {pending ? t("creating") : t("create")}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="h-9 rounded-md px-4 text-sm hover:bg-muted">
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}

export function DeletePostButton({ id, title }: { id: string; title: string }) {
  const t = useTranslations("AdminBlog");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={t("deletePost", { title })}
      title={t("deletePost", { title })}
      onClick={() => {
        if (!window.confirm(t("confirmDeletePost", { title }))) return;
        startTransition(async () => {
          let result;
          try {
            result = await deletePostAction({ id });
          } catch (error) {
            console.error("delete post failed", error);
            toast.error(t("toast.failed"));
            return;
          }
          if (result.ok) {
            toast.success(t("toast.deleted"));
            router.refresh();
          } else toast.error((result as BlogActionFailure).code === "FAILED" ? t("toast.failed") : (result as BlogActionFailure).message);
        });
      }}
      className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive disabled:opacity-50"
      data-testid="delete-post"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
