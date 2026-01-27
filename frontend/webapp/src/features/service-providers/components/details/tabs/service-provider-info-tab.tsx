"use client";

import { useLocale, useTranslations } from "next-intl";

import { LexicalRenderer } from "@/components/editor/lexical-renderer";
import { MapViewer } from "@/components/map/map-viewer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { localeToHeader } from "@/config/locales";
import { getLocalizedValue } from "@/features/shared/utils/localization";
import { LocaleTypes } from "@/types/common";

import { ServiceProviderDetails } from "../../../types";
import { TRANSLATION_KEY } from "../../../types/constants";

interface ServiceProviderInfoTabProps {
  serviceProvider: ServiceProviderDetails;
}

export default function ServiceProviderInfoTab({
  serviceProvider,
}: ServiceProviderInfoTabProps) {
  const t = useTranslations(TRANSLATION_KEY);
  const locale = useLocale();
  const localeHeader = localeToHeader(locale as LocaleTypes);

  return (
    <div className="space-y-6 pt-4">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t("form.sections.basicInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">
              {t("form.name.label")}
            </label>
            <p className="mt-1">
              {getLocalizedValue(serviceProvider.name, localeHeader)}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium">
              {t("form.description.label")}
            </label>
            <div className="mt-1">
              <LexicalRenderer
                content={getLocalizedValue(
                  serviceProvider.description,
                  localeHeader
                )}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">
              {t("form.providerTypeId.label")}
            </label>
            <p className="mt-1">{serviceProvider.providerTypeName}</p>
          </div>
          <div>
            <label className="text-sm font-medium">{t("status.label")}</label>
            <div className="mt-1">
              <Badge
                variant={serviceProvider.isActive ? "default" : "secondary"}
              >
                {serviceProvider.isActive
                  ? t("status.active")
                  : t("status.inactive")}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t("form.sections.contactInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">
              {t("form.email.label")}
            </label>
            <p className="mt-1">{serviceProvider.email}</p>
          </div>
          {serviceProvider.phoneNumber && (
            <div>
              <label className="text-sm font-medium">
                {t("form.phoneNumber.label")}
              </label>
              <p className="mt-1">{serviceProvider.phoneNumber}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle>{t("form.sections.addressInfo")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {serviceProvider.coordinates && (
            <div>
              <label className="text-sm font-medium">
                {t("form.location.label")}
              </label>
              <div className="mt-2">
                <MapViewer
                  coordinates={serviceProvider.coordinates}
                  height="300px"
                />
              </div>
            </div>
          )}
          <div>
            <label className="text-sm font-medium">
              {t("form.country.label")}
            </label>
            <p className="mt-1">{serviceProvider.country}</p>
          </div>
          <div>
            <label className="text-sm font-medium">
              {t("form.city.label")}
            </label>
            <p className="mt-1">{serviceProvider.city}</p>
          </div>
          {serviceProvider.street && (
            <div>
              <label className="text-sm font-medium">
                {t("form.street.label")}
              </label>
              <p className="mt-1">
                {getLocalizedValue(serviceProvider.street, localeHeader)}
              </p>
            </div>
          )}
          {serviceProvider.detail && (
            <div>
              <label className="text-sm font-medium">
                {t("form.detail.label")}
              </label>
              <p className="mt-1">
                {getLocalizedValue(serviceProvider.detail, localeHeader)}
              </p>
            </div>
          )}
          {serviceProvider.zipCode && (
            <div>
              <label className="text-sm font-medium">
                {t("form.zipCode.label")}
              </label>
              <p className="mt-1">{serviceProvider.zipCode}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
