"use client";

import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Star } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import useAction from "@/hooks/use-action";

import { addComment } from "../../actions/add-comment";
import { AddCommentSchema } from "../../actions/add-comment/schema";
import { InputType } from "../../actions/add-comment/types";
import { useCommentsCacheManagement } from "../../api/client/get-comments-by-service-provider-client";
import { SERVICE_PROVIDER_COMMENTS_TRANSLATION_KEY } from "../../types/constants";

interface AddCommentFormProps {
  serviceProviderId: string;
  onAdded?: () => void;
}

export function AddCommentForm({
  serviceProviderId,
  onAdded,
}: AddCommentFormProps) {
  const t = useTranslations(SERVICE_PROVIDER_COMMENTS_TRANSLATION_KEY);
  const [isPending, startTransition] = useTransition();
  const [selectedRating, setSelectedRating] = useState<number | undefined>();
  const { invalidateProviderCache } = useCommentsCacheManagement();

  const form = useForm<InputType>({
    resolver: zodResolver(AddCommentSchema),
    defaultValues: {
      serviceProviderId,
      commentText: "",
      rating: undefined,
    },
  });

  const { execute } = useAction(addComment, {
    startTransition,
    onSuccess: () => {
      toast.success(t("addSuccess"));
      form.reset();
      setSelectedRating(undefined);
      onAdded?.();
      invalidateProviderCache(serviceProviderId);
    },
    onError: (error) => {
      toast.error(error.detail || error.title || t("addFailed"));
    },
  });

  const onSubmit = (data: InputType) => {
    execute({
      ...data,
      rating: selectedRating,
    });
  };

  return (
    <ZodErrorProvider
      componentNamespace={SERVICE_PROVIDER_COMMENTS_TRANSLATION_KEY}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Rating Selection */}
          <div className="space-y-2">
            <FormLabel>{t("rating")}</FormLabel>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() =>
                    setSelectedRating(
                      selectedRating === rating ? undefined : rating
                    )
                  }
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-6 w-6 ${
                      selectedRating && rating <= selectedRating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment Text */}
          <FormField
            control={form.control}
            name="commentText"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("comment")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("commentPlaceholder")}
                    className="resize-none"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isPending}>
            {isPending ? t("submitting") : t("submit")}
          </Button>
        </form>
      </Form>
    </ZodErrorProvider>
  );
}
