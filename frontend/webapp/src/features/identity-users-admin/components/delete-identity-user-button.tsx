"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { deleteIdentityUserAction } from "../actions/delete-identity-user";

export function DeleteIdentityUserButton({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const remove = () =>
    startTransition(async () => {
      try {
        await deleteIdentityUserAction({ userId });
        toast.success("کاربر حذف شد.");
        router.push("/admin/identity-users");
      } catch (error: any) {
        toast.error(error?.message ?? "خطا در حذف کاربر");
      }
    });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="destructive" disabled={isPending}>
          حذف کاربر
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>حذف کاربر «{userName}»؟</AlertDialogTitle>
          <AlertDialogDescription>
            این عمل قابل بازگشت نیست. کاربر و همهٔ داده‌های وابسته (نقش‌ها، توکن‌ها، ترجیحات) حذف می‌شوند.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>انصراف</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              remove();
            }}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "در حال حذف..." : "حذف قطعی"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
