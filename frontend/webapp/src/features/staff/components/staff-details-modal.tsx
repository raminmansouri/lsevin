"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { ResponsiveModal } from "@/components/responsive-modal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { localeToHeader } from "@/config/locales";
import { LocalizedDisplay } from "@/features/shared/components/LocalizedDisplay";
import { LocaleTypes } from "@/types/common";

import { useStaffDetails } from "../api/client/get-staff-details-query";
import { STAFF_TRANSLATION_KEY } from "../constants";
import { Staff } from "../types";
import { StaffAvailabilityManager } from "./staff-availability-manager";
import { StaffServiceManager } from "./staff-service-manager";

interface StaffDetailsModalProps {
  staff: Staff;
  trigger?: React.ReactNode;
  onClose?: () => void;
}

export function StaffDetailsModal({
  staff,
  trigger,
  onClose,
}: StaffDetailsModalProps) {
  const [open, setOpen] = useState(!trigger); // Auto-open if no trigger provided
  const [activeTab, setActiveTab] = useState("overview"); // Maintain active tab state
  const t = useTranslations(STAFF_TRANSLATION_KEY);
  const locale = useLocale();
  const localeHeader = localeToHeader(locale as LocaleTypes);

  const {
    data: details,
    error,
    isFetching: isLoading,
    refetch,
  } = useStaffDetails(open ? staff.id : "");
  const handleUpdate = () => {
    // Refresh the details
    refetch();
  };

  const handleTriggerClick = () => {
    setOpen(true);
  };

  return (
    <>
      {trigger ? (
        <div onClick={handleTriggerClick}>{trigger}</div>
      ) : (
        <Button variant="ghost" size="sm" onClick={handleTriggerClick}>
          <Eye className="mr-2 h-4 w-4" />
          {t("actions.viewDetails")}
        </Button>
      )}

      <ResponsiveModal
        isSheet
        size="3xl"
        open={open}
        onOpenChange={(newOpen) => {
          setOpen(newOpen);
          if (!newOpen && onClose) {
            onClose();
          }
        }}
        title={t("details.title")}
        description={t("details.description", { name: staff.name })}
      >
        {isLoading ? (
          <StaffDetailsModalSkeleton />
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-destructive">
              {error.title || t("messages.fetchError")}
            </p>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="mt-4"
            >
              {t("actions.retry")}
            </Button>
          </div>
        ) : details ? (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
              <TabsTrigger value="availabilities">
                {t("tabs.availabilities")} ({details.availabilities.length})
              </TabsTrigger>
              <TabsTrigger value="services">
                {t("tabs.services")} ({details.services.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium">{t("details.basicInfo")}</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>{t("form.name.label")}:</strong>
                      <LocalizedDisplay
                        content={details.name}
                        currentLocale={localeHeader}
                      />
                    </div>
                    <div>
                      <strong>{t("form.title.label")}:</strong>
                      <LocalizedDisplay
                        content={details.title}
                        currentLocale={localeHeader}
                      />
                    </div>
                    <div>
                      <strong>{t("form.biography.label")}:</strong>
                      <LocalizedDisplay
                        content={details.biography}
                        currentLocale={localeHeader}
                        showAllTranslations
                        richText
                      />
                    </div>
                    {/* <p>
                      <strong>{t("form.isActive")}:</strong>{" "}
                      {details.isActive
                        ? t("status.active")
                        : t("status.inactive")}
                    </p> */}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium">{t("details.statsInfo")}</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>{t("details.totalAvailabilities")}:</strong>{" "}
                      {details.availabilities.length}
                    </p>
                    <p>
                      <strong>{t("details.totalServices")}:</strong>{" "}
                      {details.services.length}
                    </p>
                    <p>
                      <strong>{t("details.activeServices")}:</strong>{" "}
                      {details.services.filter((s) => s.isActive).length}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="availabilities">
              <StaffAvailabilityManager
                staff={details}
                onUpdate={handleUpdate}
              />
            </TabsContent>

            <TabsContent value="services">
              <StaffServiceManager staff={details} onUpdate={handleUpdate} />
            </TabsContent>
          </Tabs>
        ) : null}
      </ResponsiveModal>
    </>
  );
}

function StaffDetailsModalSkeleton() {
  return (
    <div className="space-y-6">
      {/* Tab skeleton */}
      <div className="bg-muted flex space-x-1 rounded-lg p-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 flex-1 rounded-md" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
