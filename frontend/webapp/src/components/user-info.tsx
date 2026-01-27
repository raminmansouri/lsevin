"use client";

import { LogOut, User } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentSession } from "@/hooks/use-current-session";
import { Link } from "@/i18n/navigation";
import { UserRole } from "@/types/common";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Skeleton } from "./ui/skeleton";

const UserInfo = () => {
  const { user, status } = useCurrentSession(true);
  const isAdmin = user?.roles?.includes(UserRole.Admin);
  const t = useTranslations("UserInfo");

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="size-8 rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="relative size-8 rounded-full">
          <Avatar>
            <AvatarImage src={undefined} alt={user.firstName} />
            <AvatarFallback className="bg-secondary">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="mb-2 font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm leading-none font-medium">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-muted-foreground text-xs leading-none">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            {isAdmin ? (
              <Link href="/admin/dashboard">
                <User className="mr-2 h-4 w-4" />
                <span>{t("adminPanel")}</span>
              </Link>
            ) : (
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                <span>{t("profile")}</span>
              </Link>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>{t("signOut")}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserInfo;
