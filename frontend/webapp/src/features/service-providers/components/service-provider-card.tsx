"use client";

import { useTranslations } from "next-intl";

import {
  hasLexicalContent,
  LexicalRenderer,
} from "@/components/editor/lexical-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import {
  DEFAULT_LOCALE_HEADER,
  getNumberFormatLocale,
  isSupportedLocaleHeader,
  LOCALE_CURRENCY_MAP,
} from "@/config/locales";
import { TRANSLATION_KEY } from "@/features/home/types/constants";
import { Link } from "@/i18n/navigation";

import { IServiceProvider } from "../types";
import { resolveMediaUrl } from "../lib/media-url";

interface ServiceProviderCardProps {
  provider: IServiceProvider;
}

export const ServiceProviderCard = ({ provider }: ServiceProviderCardProps) => {
  const t = useTranslations(TRANSLATION_KEY);
  // Format price
  const formatPrice = (price: number, currency: string) => {
    // Find the locale header that uses this currency
    const foundLocaleHeader = Object.entries(LOCALE_CURRENCY_MAP).find(
      ([_, curr]) => curr === currency
    )?.[0];

    // Validate the found locale header and provide fallback
    const validLocaleHeader =
      foundLocaleHeader && isSupportedLocaleHeader(foundLocaleHeader)
        ? foundLocaleHeader
        : DEFAULT_LOCALE_HEADER;

    return new Intl.NumberFormat(
      getNumberFormatLocale(validLocaleHeader)
    ).format(price);
  };

  return (
    <Card className="group hover:border-primary flex h-full flex-col overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className="relative flex flex-1 flex-col">
        {/* Mobile: Horizontal Layout, Desktop: Vertical Layout */}
        <div className="flex h-full flex-row items-center md:flex-col md:items-stretch">
          {/* Service Provider Image */}
          <div className="p-2 md:w-full md:p-0">
            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl md:h-48 md:w-full md:rounded-none">
              <ImageWithFallback
                src={resolveMediaUrl(provider.thumbnailUrl)}
                alt={provider.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 80px, (max-width: 1200px) 50vw, 25vw"
                fallbackClassName="rounded-xl md:rounded-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          </div>

          {/* Content */}
          <CardContent className="flex h-full w-full min-w-0 flex-1 flex-col py-1 ps-3 pe-3 md:p-2">
            {/* Main content area that can expand */}
            <div className="min-w-0 flex-1 space-y-1 md:space-y-2">
              {/* Provider Name */}
              <div className="flex min-w-0 flex-row items-center justify-between">
                <h4 className="line-clamp-2 min-w-0 flex-1 pr-1 text-sm leading-tight font-bold md:text-lg">
                  {provider.name}
                </h4>
                <Button
                  variant="link"
                  asChild
                  className="flex-shrink-0 p-0 text-xs hover:no-underline md:text-sm"
                >
                  <Link href={`/service-providers/${provider.id}`}>
                    {t("serviceProviders.view")}
                  </Link>
                </Button>
              </div>

              {/* Attributes - Mobile: Below title, Desktop: Keep existing layout */}
              {provider.attributes && provider.attributes.length > 0 && (
                <div className="flex max-w-full min-w-0 gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] md:hidden [&::-webkit-scrollbar]:hidden">
                  {provider.attributes.slice(0, 3).map((attribute, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="flex-shrink-0 text-xs whitespace-nowrap"
                    >
                      {attribute.attributeName} :{" "}
                      {hasLexicalContent(attribute.value) ? (
                        <LexicalRenderer content={attribute.value} />
                      ) : (
                        <span>{attribute.value}</span>
                      )}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Desktop: Attributes in different position */}
              {provider.attributes && provider.attributes.length > 0 && (
                <div className="hidden max-w-full min-w-0 gap-1 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] md:flex [&::-webkit-scrollbar]:hidden">
                  {provider.attributes.slice(0, 3).map((attribute, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="flex-shrink-0 text-xs whitespace-nowrap"
                    >
                      {attribute.attributeName} :{" "}
                      {hasLexicalContent(attribute.value) ? (
                        <LexicalRenderer content={attribute.value} />
                      ) : (
                        <span>{attribute.value}</span>
                      )}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Price - Always at bottom */}
            <div className="mt-auto min-w-0 justify-end">
              <div className="flex min-w-0 flex-row items-center justify-between">
                <p className="text-muted-foreground flex-shrink-0 text-xs md:text-sm">
                  {t("serviceProviders.priceStartsFrom")}
                </p>
                <div className="flex flex-shrink-0 items-center gap-1 md:gap-2 rtl:flex-row-reverse">
                  <span className="text-primary text-lg font-bold md:text-xl">
                    {formatPrice(
                      provider.minimumServicePrice,
                      provider.currency
                    )}
                  </span>
                  <span className="text-muted-foreground text-xs md:text-sm">
                    {provider.currency}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
};

export default ServiceProviderCard;
