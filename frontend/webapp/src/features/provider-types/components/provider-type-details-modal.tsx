"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { LexicalRenderer } from "@/components/editor/lexical-renderer";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LocaleTypes } from "@/features/shared/types/localization";
import {
  getLocalizedValue,
  localeToHeader,
} from "@/features/shared/utils/localization";

import { useProviderTypeDetails } from "../api/client/get-provider-type-details-query";
import { PROVIDER_TYPE_TRANSLATION_KEY } from "../constants";
import { ProviderAttributeDefinitionManager } from "./provider-attribute-definition-manager";

interface ProviderTypeDetailsModalProps {
  providerTypeId: string;
  trigger?: React.ReactNode;
  onClose?: () => void;
  onUpdate?: () => void;
}

export function ProviderTypeDetailsModal({
  providerTypeId,
  trigger,
  onClose,
  onUpdate,
}: ProviderTypeDetailsModalProps) {
  const [open, setOpen] = useState(!trigger);
  const [activeTab, setActiveTab] = useState("overview"); // Maintain active tab state
  const t = useTranslations(PROVIDER_TYPE_TRANSLATION_KEY);
  const locale = useLocale();
  const localeHeader = localeToHeader(locale as LocaleTypes);
  const {
    data: providerType,
    error,
    isFetching: isLoading,
    refetch,
  } = useProviderTypeDetails(open ? providerTypeId : "");

  const handleUpdate = () => {
    // Refresh the details
    refetch();
    // Trigger parent component to refresh data
    onUpdate?.();
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
        description={t("details.description", {
          name: providerType?.name
            ? typeof providerType.name === "string"
              ? providerType.name
              : getLocalizedValue(providerType.name, localeHeader)
            : "",
        })}
      >
        {isLoading ? (
          <ProviderTypeDetailsModalSkeleton />
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
        ) : providerType ? (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
              <TabsTrigger value="attributes">
                {t("tabs.attributes")} (
                {providerType.attributeDefinitions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium">{t("details.basicInfo")}</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>{t("form.name.label")}:</strong>{" "}
                      {typeof providerType.name === "string"
                        ? providerType.name
                        : getLocalizedValue(providerType.name, localeHeader)}
                    </p>
                    <div>
                      <strong>{t("form.description.label")}:</strong>{" "}
                      {typeof providerType.description === "string" ? (
                        providerType.description
                      ) : (
                        <LexicalRenderer
                          content={getLocalizedValue(
                            providerType.description,
                            localeHeader
                          )}
                        />
                      )}
                    </div>
                    <p>
                      <strong>{t("form.isActive")}:</strong>{" "}
                      {providerType.isActive
                        ? t("status.active")
                        : t("status.inactive")}
                    </p>
                    <p>
                      <strong>{t("details.created")}:</strong>{" "}
                      {new Date(providerType.createDate).toLocaleDateString()}
                    </p>
                    {providerType.lastModifiedDate && (
                      <p>
                        <strong>{t("details.modified")}:</strong>{" "}
                        {new Date(
                          providerType.lastModifiedDate
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium">{t("details.statistics")}</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <strong>{t("details.attributeDefinitionsCount")}:</strong>{" "}
                      {providerType.attributeDefinitions.length}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="attributes">
              <ProviderAttributeDefinitionManager
                providerType={providerType}
                onUpdate={handleUpdate}
              />
            </TabsContent>
          </Tabs>
        ) : null}
      </ResponsiveModal>
    </>
  );
}

function ProviderTypeDetailsModalSkeleton() {
  return (
    <div className="space-y-6">
      {/* Tab skeleton */}
      <div className="bg-muted flex space-x-1 rounded-lg p-1">
        {Array.from({ length: 2 }).map((_, i) => (
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
