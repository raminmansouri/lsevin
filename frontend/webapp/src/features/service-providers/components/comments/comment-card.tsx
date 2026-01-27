"use client";

import { Star, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { IServiceProviderComment } from "../../types";
import { SERVICE_PROVIDER_COMMENTS_TRANSLATION_KEY } from "../../types/constants";

interface CommentCardProps {
  comment: IServiceProviderComment;
  onDelete: (comment: IServiceProviderComment) => void;
}

export function CommentCard({ comment, onDelete }: CommentCardProps) {
  const t = useTranslations(SERVICE_PROVIDER_COMMENTS_TRANSLATION_KEY);

  const handleDelete = () => {
    onDelete(comment);
  };

  return (
    <Card className={comment.isMine ? "border-primary/50" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base">{comment.customerName}</CardTitle>
            <CardDescription className="text-sm">
              {new Date(comment.createDate).toLocaleDateString()}
            </CardDescription>
          </div>

          {/* Show delete button ONLY for user's own comments */}
          {comment.isMine && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Rating stars */}
        {comment.rating && (
          <div className="mt-2 flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < comment.rating!
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm">{comment.commentText}</p>
        {comment.isMine && (
          <p className="text-muted-foreground mt-2 text-xs">
            {t("yourComment")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
