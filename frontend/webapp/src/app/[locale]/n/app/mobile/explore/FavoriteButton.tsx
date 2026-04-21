"use client";

import { Heart } from "lucide-react";
import { useFormStatus } from "react-dom";

import {
  toggleExploreFavoriteAction,
  type FavoriteEntityType,
} from "./explore.actions";

function InnerHeart({ active }: { active: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <Heart
        size={18}
        className={active ? "text-rose-500 fill-rose-500" : "text-gray-600"}
      />
    </button>
  );
}

export default function FavoriteButton({
  customerId,
  entityId,
  favoriteType,
  active,
  path,
}: {
  customerId: string | null;
  entityId: string;
  favoriteType: FavoriteEntityType;
  active: boolean;
  path?: string;
}) {
  if (!customerId) {
    return (
      <button className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center opacity-70">
        <Heart size={18} className="text-gray-400" />
      </button>
    );
  }

  const action = toggleExploreFavoriteAction.bind(null, {
    customerId,
    entityId,
    favoriteType,
    path,
  });

  return (
    <form action={action} onClick={(e) => e.stopPropagation()}>
      <InnerHeart active={active} />
    </form>
  );
}
