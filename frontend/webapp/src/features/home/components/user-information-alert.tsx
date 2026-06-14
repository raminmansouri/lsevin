"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { ResponsiveModal } from "@/components/responsive-modal";
import { Button } from "@/components/ui/button";
import { ICurrentUser } from "@/features/shared/types/user";
import { useRouter } from "@/i18n/navigation";

type Props = ICurrentUser;
const UserInformationWarning = ({ gender, birthDate, address }: Props) => {
  const router = useRouter();
  const t = useTranslations("User.Information");
  const hasShownModal = useRef(false);

  // React Compiler will automatically optimize this calculation
  const isProfileIncomplete = !gender || !birthDate || !address;

  const [isOpen, setIsOpen] = useState(() => {
    // Only show modal if profile is incomplete and we haven't shown it yet this session
    return isProfileIncomplete && !hasShownModal.current;
  });

  // Update the modal state if profile completion status changes
  useEffect(() => {
    if (isProfileIncomplete && !hasShownModal.current) {
      setIsOpen(true);
      hasShownModal.current = true;
    } else if (!isProfileIncomplete) {
      setIsOpen(false);
      hasShownModal.current = false;
    }
  }, [isProfileIncomplete]);

  // React Compiler will automatically memoize these functions
  const handleCompleteInformation = () => {
    router.push("/profile?tab=additional");
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      hasShownModal.current = true; // Mark as shown when user dismisses
    }
  };

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={handleOpenChange}
      title={t("incompleteProfileTitle")}
      description={t("completeProfileWarning")}
    >
      <div className="flex flex-col gap-4 py-6">
        <p className="text-base">{t("completeProfileWarning")}</p>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleCompleteInformation}>
            {t("goToProfile")}
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
};

export default UserInformationWarning;
