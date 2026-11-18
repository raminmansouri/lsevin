"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { LocalizedInput } from "@/features/shared/components/LocalizedInput";

import { deleteAuthorAction, deleteCategoryAction, saveAuthorAction, saveCategoryAction } from "../../actions";
import type { BlogActionFailure } from "../../actions/result";
import type { AuthorRow, CategoryRow } from "../../types";
import { Field, TextInput } from "./block-editors";
import { MediaCacheProvider, MediaPicker, useStandaloneMediaCache, type MediaInfo } from "./media-field";

const displayName = (names: Record<string, string>, key: string) => names[key] || names["en-US"] || names["fa-IR"] || Object.values(names)[0] || "";

function CategoryForm({ category, onDone, localeKey }: { category: CategoryRow | null; onDone: () => void; localeKey: string }) {
  const t = useTranslations("AdminBlog");
  const router = useRouter();
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [name, setName] = useState<Record<string, string>>(category?.name ?? {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  void localeKey;
  return (
    <form
      className="space-y-3 rounded-xl border bg-muted/30 p-3"
      onSubmit={(event) => {
        event.preventDefault();
        setErrors({});
        startTransition(async () => {
          let result;
          try {
            result = await saveCategoryAction({ id: category?.id ?? null, slug, name, sortOrder: category?.sortOrder ?? 0, isActive: true });
          } catch (error) {
            console.error("save category failed", error);
            toast.error(t("toast.failed"));
            return;
          }
          if (result.ok) {
            toast.success(t("toast.saved"));
            router.refresh();
            onDone();
            return;
          }
          const failure = result as BlogActionFailure;
          setErrors(failure.fieldErrors ?? {});
          toast.error(failure.code === "FAILED" ? t("toast.failed") : failure.message);
        });
      }}
      data-testid="category-form"
    >
      <Field label={t("settings.slug")} error={errors.slug}>
        {(id) => <TextInput id={id} value={slug} dir="ltr" maxLength={80} onChange={(value) => setSlug(value.toLowerCase())} testId="category-slug" />}
      </Field>
      <LocalizedInput label={t("taxonomy.name")} value={{ translations: name }} onChange={(value) => setName(value.translations as Record<string, string>)} maxLength={80} error={errors.name} />
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="h-9 rounded-md bg-primary px-4 text-sm text-primary-foreground disabled:opacity-50" data-testid="category-save">
          {t("save")}
        </button>
        <button type="button" onClick={onDone} className="h-9 rounded-md px-4 text-sm hover:bg-muted">
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}

function AuthorForm({ author, onDone, media }: { author: AuthorRow | null; onDone: () => void; media: Record<string, MediaInfo> }) {
  const t = useTranslations("AdminBlog");
  const router = useRouter();
  const [name, setName] = useState<Record<string, string>>(author?.name ?? {});
  const [bio, setBio] = useState<Record<string, string>>(author?.bio ?? {});
  const [credentials, setCredentials] = useState<Record<string, string>>(author?.credentials ?? {});
  const [avatar, setAvatar] = useState<string | null>(author?.avatarMedia ?? null);
  const [reviewer, setReviewer] = useState(author?.isMedicalReviewer ?? false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const cache = useStandaloneMediaCache(media);
  return (
    <MediaCacheProvider value={cache}>
      <form
        className="space-y-3 rounded-xl border bg-muted/30 p-3"
        onSubmit={(event) => {
          event.preventDefault();
          setErrors({});
          startTransition(async () => {
            let result;
            try {
              result = await saveAuthorAction({ id: author?.id ?? null, name, bio, credentials, avatarMedia: avatar, isMedicalReviewer: reviewer });
            } catch (error) {
              console.error("save author failed", error);
              toast.error(t("toast.failed"));
              return;
            }
            if (result.ok) {
              toast.success(t("toast.saved"));
              router.refresh();
              onDone();
              return;
            }
            const failure = result as BlogActionFailure;
            setErrors(failure.fieldErrors ?? {});
            toast.error(failure.code === "FAILED" ? t("toast.failed") : failure.message);
          });
        }}
        data-testid="author-form"
      >
        <LocalizedInput label={t("taxonomy.authorName")} value={{ translations: name }} onChange={(value) => setName(value.translations as Record<string, string>)} maxLength={120} error={errors.name} />
        <LocalizedInput label={t("taxonomy.credentials")} value={{ translations: credentials }} onChange={(value) => setCredentials(value.translations as Record<string, string>)} maxLength={200} />
        <LocalizedInput label={t("taxonomy.bio")} value={{ translations: bio }} onChange={(value) => setBio(value.translations as Record<string, string>)} multiline rows={3} maxLength={1000} />
        <MediaPicker kind="image" label={t("taxonomy.avatar")} value={avatar} onChange={(id) => setAvatar(id)} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={reviewer} onChange={(event) => setReviewer(event.target.checked)} data-testid="author-reviewer" />
          {t("taxonomy.medicalReviewer")}
        </label>
        <div className="flex gap-2">
          <button type="submit" disabled={pending} className="h-9 rounded-md bg-primary px-4 text-sm text-primary-foreground disabled:opacity-50" data-testid="author-save">
            {t("save")}
          </button>
          <button type="button" onClick={onDone} className="h-9 rounded-md px-4 text-sm hover:bg-muted">
            {t("cancel")}
          </button>
        </div>
      </form>
    </MediaCacheProvider>
  );
}

/** Categories and authors (used by the post settings and the public pages). */
export function TaxonomyPanel({ categories, authors, localeKey, media }: { categories: CategoryRow[]; authors: AuthorRow[]; localeKey: string; media: Record<string, MediaInfo> }) {
  const t = useTranslations("AdminBlog");
  const router = useRouter();
  const [editingCategory, setEditingCategory] = useState<CategoryRow | "new" | null>(null);
  const [editingAuthor, setEditingAuthor] = useState<AuthorRow | "new" | null>(null);
  const [pending, startTransition] = useTransition();

  const remove = (kind: "category" | "author", id: string, label: string) => {
    if (!window.confirm(t(kind === "category" ? "confirmDeleteCategory" : "confirmDeleteAuthor", { name: label }))) return;
    startTransition(async () => {
      let result;
      try {
        result = kind === "category" ? await deleteCategoryAction({ id }) : await deleteAuthorAction({ id });
      } catch (error) {
        console.error("remove taxonomy item failed", error);
        toast.error(t("toast.failed"));
        return;
      }
      if (result.ok) {
        toast.success(t("toast.deleted"));
        router.refresh();
      } else toast.error((result as BlogActionFailure).code === "FAILED" ? t("toast.failed") : (result as BlogActionFailure).message);
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2" data-testid="taxonomy">
      <section className="space-y-3 rounded-2xl border bg-card p-4" aria-labelledby="blog-categories">
        <div className="flex items-center justify-between">
          <h2 id="blog-categories" className="font-semibold">
            {t("taxonomy.categories")}
          </h2>
          <button type="button" onClick={() => setEditingCategory("new")} className="h-8 rounded-md border px-3 text-sm hover:bg-muted" data-testid="category-new">
            {t("taxonomy.addCategory")}
          </button>
        </div>
        {editingCategory ? <CategoryForm key={editingCategory === "new" ? "new" : editingCategory.id} category={editingCategory === "new" ? null : editingCategory} localeKey={localeKey} onDone={() => setEditingCategory(null)} /> : null}
        <ul className="divide-y text-sm">
          {categories.map((category) => (
            <li key={category.id} className="flex items-center justify-between gap-2 py-2" data-testid="category-row">
              <span>
                {displayName(category.name, localeKey)} <span className="font-mono text-xs text-muted-foreground">/{category.slug}</span>
              </span>
              <span className="flex gap-1">
                <button type="button" onClick={() => setEditingCategory(category)} className="rounded-md px-2 py-1 text-xs hover:bg-muted">
                  {t("edit")}
                </button>
                <button type="button" disabled={pending} onClick={() => remove("category", category.id, displayName(category.name, localeKey))} className="rounded-md px-2 py-1 text-xs text-destructive hover:bg-muted" data-testid="category-delete">
                  {t("remove")}
                </button>
              </span>
            </li>
          ))}
          {!categories.length ? <li className="py-2 text-muted-foreground">{t("taxonomy.noCategories")}</li> : null}
        </ul>
      </section>

      <section className="space-y-3 rounded-2xl border bg-card p-4" aria-labelledby="blog-authors">
        <div className="flex items-center justify-between">
          <h2 id="blog-authors" className="font-semibold">
            {t("taxonomy.authors")}
          </h2>
          <button type="button" onClick={() => setEditingAuthor("new")} className="h-8 rounded-md border px-3 text-sm hover:bg-muted" data-testid="author-new">
            {t("taxonomy.addAuthor")}
          </button>
        </div>
        {editingAuthor ? <AuthorForm key={editingAuthor === "new" ? "new" : editingAuthor.id} author={editingAuthor === "new" ? null : editingAuthor} media={media} onDone={() => setEditingAuthor(null)} /> : null}
        <ul className="divide-y text-sm">
          {authors.map((author) => (
            <li key={author.id} className="flex items-center justify-between gap-2 py-2" data-testid="author-row">
              <span>
                {displayName(author.name, localeKey)}
                {author.isMedicalReviewer ? <span className="ms-2 rounded bg-muted px-1.5 py-0.5 text-xs">{t("taxonomy.reviewerBadge")}</span> : null}
              </span>
              <span className="flex gap-1">
                <button type="button" onClick={() => setEditingAuthor(author)} className="rounded-md px-2 py-1 text-xs hover:bg-muted">
                  {t("edit")}
                </button>
                <button type="button" disabled={pending} onClick={() => remove("author", author.id, displayName(author.name, localeKey))} className="rounded-md px-2 py-1 text-xs text-destructive hover:bg-muted" data-testid="author-delete">
                  {t("remove")}
                </button>
              </span>
            </li>
          ))}
          {!authors.length ? <li className="py-2 text-muted-foreground">{t("taxonomy.noAuthors")}</li> : null}
        </ul>
      </section>
    </div>
  );
}
