"use client";

import { useEffect, useMemo, useState } from "react";

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
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

import { resolveMediaUrl } from "@/features/profile/components/profile-image-picker";
import { EditProfileInitialData } from "@/features/profile/schemas/profile.schema";
import { useCurrentSession } from "@/hooks/use-current-session";
import { Link } from "@/i18n/navigation";
import { UserRole } from "@/types/common";

const UserInfo = ({
                      profile,
                  }: {
    profile: EditProfileInitialData;
}) => {
    const [mounted, setMounted] = useState(false);

    const { user, status } = useCurrentSession(true);
    const t = useTranslations("UserInfo");

    useEffect(() => {
        setMounted(true);
    }, []);

    const isAdmin = user?.roles?.includes(UserRole.Admin);

    const resolvedImageUrl = useMemo(
        () => resolveMediaUrl(profile?.profileImageUrl),
        [profile?.profileImageUrl],
    );

    const fullName = `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim();

    const initials = useMemo(() => {
        const value = fullName
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join("");

        return value || "U";
    }, [fullName]);

    if (!mounted || status === "loading") {
        return (
            <div className="flex items-center gap-2">
                <Skeleton className="size-8 rounded-full" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative size-8 rounded-full p-0"
                >
                    <Avatar>
                        <AvatarImage
                            src={resolvedImageUrl}
                            alt={fullName || "User"}
                        />

                        <AvatarFallback className="bg-secondary">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                className="w-56"
                align="end"
                forceMount
            >
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