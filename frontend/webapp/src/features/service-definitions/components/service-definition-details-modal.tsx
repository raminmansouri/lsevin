"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { SafeLexicalRenderer } from "./safe-lexical-renderer";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { localeToHeader } from "@/config/locales";
import { getLocalizedValue } from "@/features/shared/utils/localization";
import { LocaleTypes } from "@/types/common";

import { useServiceDefinitionDetails } from "../api/client/get-service-definition-details-query";
import { SERVICE_DEFINITION_TRANSLATION_KEY } from "../constants";
import { ServiceDefinition } from "../types/service-definition";
import { ServiceAttributeDefinitionManager } from "./service-attribute-definition-manager";
import { ServiceRequirementManager } from "./service-requirement-manager";
import { ServiceUploadFileRequirementManager } from "./service-upload-file-requirement-manager";

interface ServiceDefinitionDetailsModalProps {
  serviceDefinition: ServiceDefinition;
  trigger?: React.ReactNode;
  onClose?: () => void;
}

export function ServiceDefinitionDetailsModal({
  serviceDefinition,
  trigger,
  onClose,
}: ServiceDefinitionDetailsModalProps) {
  const [open, setOpen] = useState(!trigger); // Auto-open if no trigger provided
  const [activeTab, setActiveTab] = useState("overview"); // Maintain active tab state
  const t = useTranslations(SERVICE_DEFINITION_TRANSLATION_KEY);
  const locale = useLocale();
  const localeHeader = localeToHeader(locale as LocaleTypes);

  const {
    data: details,
    error,
    isFetching: isLoading,
    refetch,
  } = useServiceDefinitionDetails(open ? serviceDefinition.id : "", locale);

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
        description={t("details.description", { name: serviceDefinition.name })}
      >
        {isLoading ? (
          <ServiceDefinitionDetailsModalSkeleton />
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
              <TabsTrigger value="attributes">
                {t("tabs.attributes")} ({details.attributeDefinitions.length})
              </TabsTrigger>
              <TabsTrigger value="requirements">
                {t("tabs.requirements")} ({details.requirements.length})
              </TabsTrigger>
              <TabsTrigger value="uploads">
                Uploads ({details.uploadRequirements.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium">{t("details.basicInfo")}</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>{t("form.name.label")}:</strong>{" "}
                      {getLocalizedValue(details.name, localeHeader)}
                    </p>
                    <div>
                      <strong>{t("form.description.label")}:</strong>{" "}
                      <SafeLexicalRenderer
                        content={getLocalizedValue(
                          details.description,
                          localeHeader
                        )}
                        className="text-muted-foreground text-sm"
                      />
                    </div>
                    {/* <p>
                      <strong>{t("form.categoryId.label")}:</strong>{" "}
                      {details.categoryName}
                    </p> */}
                  </div>
                </div>
                {/* <div>
                  <h4 className="font-medium">{t("details.pricingInfo")}</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>{t("form.durationMinutes.label")}:</strong>{" "}
                      {details.durationMinutes} min
                    </p>
                    <p>
                      <strong>{t("form.value.label")}:</strong>{" "}
                      {details.basePrice} {details.currency}
                    </p>
                    <p>
                      <strong>{t("form.pricingModel.label")}:</strong>{" "}
                      {details.pricingModel}
                    </p>
                    <p>
                      <strong>{t("form.isActive.label")}:</strong>{" "}
                      {details.isActive
                        ? t("status.active")
                        : t("status.inactive")}
                    </p>
                  </div>
                </div> */}
              </div>
            </TabsContent>

            <TabsContent value="attributes">
              <ServiceAttributeDefinitionManager
                serviceDefinition={details}
                onUpdate={handleUpdate}
              />
            </TabsContent>

            <TabsContent value="requirements">
              <ServiceRequirementManager
                serviceDefinition={details}
                onUpdate={handleUpdate}
              />
            </TabsContent>

            <TabsContent value="uploads">
              <ServiceUploadFileRequirementManager
                serviceDefinition={details}
                onUpdate={handleUpdate}
              />
            </TabsContent>
          </Tabs>
        ) : null}
      </ResponsiveModal>
    </>
  );
}

function ServiceDefinitionDetailsModalSkeleton() {
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
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
