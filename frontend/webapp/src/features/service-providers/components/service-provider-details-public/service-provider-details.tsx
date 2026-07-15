import Image from "next/image";

import {
  hasLexicalContent,
  LexicalRenderer,
} from "@/components/editor/lexical-renderer";
import ServerFetchResult from "@/components/fetcher/fetch.server";
import { MapViewer } from "@/components/map/map-viewer";
import { Badge } from "@/components/ui/badge";
import { withBaseHeaders } from "@/config/http/http-service.server";
import { TranslationType } from "@/types/next";

import { getMyServiceProviderRequests } from "../../api/server/get-my-service-provider-requests";
import { IServiceProviderDetails, IServiceProviderRequest } from "../../types";
import ServiceProviderRequestsModalWrapper from "../requests/service-provider.requests-section";
import ServiceProviderCallSection from "./service-provider-call-section";
import ServiceProviderGallerySection from "./service-provider-gallery-section";
import { isVideoMedia, resolveMediaUrl } from "../../lib/media-url";

type Props = {
  serviceProvider: IServiceProviderDetails;
  t: TranslationType;
};


export const ServiceProviderDetails = async ({ serviceProvider, t }: Props) => {
  const {
    name,
    description,
    phoneNumberCountryCode,
    phoneNumber,
    address,
    coordinates,
    attributes,
    policies,
    certifications = [],
    gallery,
    services,
    staff,
  } = serviceProvider;

  const heroImage =
    gallery.length > 0
      ? gallery.sort((a, b) => a.displayOrder - b.displayOrder)[0]
      : null;
  const heroImageSrc = resolveMediaUrl(heroImage?.url);
  const heroIsVideo = isVideoMedia(heroImage?.mediaType, heroImage?.url);

  // "My requests" is per-user data behind auth. Anonymous visitors have no token,
  // so calling it would 401 and crash this public page — skip it and show none.
  const myRequestsResult = await withBaseHeaders((locale, token, userId) =>
    token
      ? getMyServiceProviderRequests({ locale, token, userId }, serviceProvider.id)
      : Promise.resolve({ data: [] as IServiceProviderRequest[] })
  );

  return (
    <div className="relative">
      {/* Hero Image Background */}
      {heroImage ? (
        <div className="relative h-80 w-full overflow-hidden md:h-96">
          {heroIsVideo ? (
            <video
              src={heroImageSrc}
              className="h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            <Image
              src={heroImageSrc}
              alt={heroImage.title || name}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Gallery count badge */}
          {gallery.length > 0 && (
            <div className="absolute top-4 right-4">
              <Badge className="border-white/20 bg-black/50 text-white">
                {t("imagesCount", { count: gallery.length })}
              </Badge>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-muted flex h-80 w-full items-center justify-center md:h-96">
          <h1 className="text-2xl font-bold md:text-3xl">{name}</h1>
        </div>
      )}

      <div className="bg-background relative -mt-6 rounded-t-3xl shadow-lg">
        {/* Header */}
        <section className="bg-primary/10 flex items-center justify-between p-4">
          <div className="text-center">
            <h1 className="text-base font-bold md:text-2xl">{name}</h1>
          </div>

          {/* Contact Button */}
          <div>
            <ServiceProviderCallSection
              phoneNumberCountryCode={phoneNumberCountryCode}
              phoneNumber={phoneNumber}
            />
          </div>
        </section>

        {/* Content */}
        <section className="flex flex-col gap-4 px-6 py-8">
          {/* About Section */}
          <div>
            <div className="mb-4 flex items-center">
              <div className="bg-primary me-3 h-2 w-2 rounded-full"></div>
              <h2 className="text-lg font-semibold">{t("aboutProvider")}</h2>
            </div>
            {description ? (
              hasLexicalContent(description) ? (
                <LexicalRenderer
                  content={description}
                  className="text-muted-foreground leading-relaxed"
                />
              ) : (
                <p className="text-muted-foreground leading-relaxed">
                  {description}
                </p>
              )
            ) : (
              <p className="text-muted-foreground leading-relaxed">
                {t("noDescription")}
              </p>
            )}
          </div>

          {/* Location & Address Section */}
          {(address || coordinates) && (
            <div>
              <div className="mb-4 flex items-center">
                <div className="bg-primary me-3 h-2 w-2 rounded-full"></div>
                <h2 className="text-lg font-semibold">{t("location")}</h2>
              </div>

              {coordinates ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Map */}
                  <div>
                    <MapViewer coordinates={coordinates} height="250px" />
                  </div>

                  {/* Address Text */}
                  <div className="flex flex-col justify-center">
                    {address && (
                      <>
                        <h3 className="mb-2 text-base font-medium">
                          {t("address")}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {address}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                address && (
                  <p className="text-muted-foreground leading-relaxed">
                    {address}
                  </p>
                )
              )}
            </div>
          )}

          {/* Services Section */}
          {services.length > 0 && (
            <div>
              <div className="mb-4 flex items-center">
                <div className="bg-primary me-3 h-2 w-2 rounded-full"></div>
                <h2 className="text-lg font-semibold">
                  {t("availableServices")}
                </h2>
              </div>
              <div className="space-y-3">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="bg-muted/20 flex items-center justify-between rounded-lg p-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{service.displayName}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {service.currency} {service.value}
                          </Badge>
                        </div>
                      </div>
                      {service.description ? (
                        hasLexicalContent(service.description) ? (
                          <LexicalRenderer
                            content={service.description}
                            className="text-muted-foreground mt-1 text-sm"
                          />
                        ) : (
                          <p className="text-muted-foreground mt-1 text-sm">
                            {service.description}
                          </p>
                        )
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Staff Section */}
          {staff.length > 0 && (
            <div>
              <div className="mb-4 flex items-center">
                <div className="bg-primary me-3 h-2 w-2 rounded-full"></div>
                <h2 className="text-lg font-semibold">{t("ourStaff")}</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {staff.map((member) => {
                  const staffImageSrc = resolveMediaUrl(member.profileImageUrl);

                  return (
                    <div
                      key={member.id}
                      className="bg-muted/20 flex gap-4 rounded-lg p-4"
                    >
                      {staffImageSrc ? (
                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-muted">
                          <Image
                            src={staffImageSrc}
                            alt={member.staffName}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                      ) : null}
                      <div className="flex-1">
                        <h3 className="font-semibold">{member.staffName}</h3>
                        {member.staffTitle && (
                          <p className="text-muted-foreground text-sm">
                            {member.staffTitle}
                          </p>
                        )}
                        {member.staffBiography ? (
                          hasLexicalContent(member.staffBiography) ? (
                            <LexicalRenderer
                              content={member.staffBiography}
                              className="text-muted-foreground mt-2 text-sm"
                            />
                          ) : (
                            <p className="text-muted-foreground mt-2 text-sm">
                              {member.staffBiography}
                            </p>
                          )
                        ) : null}
                        {member.notes ? (
                          <div className="mt-2">
                            {hasLexicalContent(member.notes) ? (
                              <LexicalRenderer
                                content={member.notes}
                                className="text-muted-foreground text-xs italic"
                              />
                            ) : (
                              <p className="text-muted-foreground text-xs italic">
                                {member.notes}
                              </p>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Attributes Section */}
          {attributes.length > 0 && (
            <div>
              <div className="mb-4 flex items-center">
                <div className="bg-primary me-3 h-2 w-2 rounded-full"></div>
                <h2 className="text-lg font-semibold">{t("attributes")}</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {attributes.map((attribute) => (
                  <Badge key={attribute.id} variant="secondary">
                    {attribute.attributeName}:{" "}
                    {hasLexicalContent(attribute.value) ? (
                      <LexicalRenderer content={attribute.value} />
                    ) : (
                      <span>{attribute.value}</span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}


          {/* Certifications Section */}
          {certifications.length > 0 && (
            <div>
              <div className="mb-4 flex items-center">
                <div className="bg-primary me-3 h-2 w-2 rounded-full"></div>
                <h2 className="text-lg font-semibold">Certifications</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {certifications.map((certificate, index) => {
                  const imageUrls = [certificate.imageUrl, certificate.secondaryImageUrl]
                    .map(resolveMediaUrl)
                    .filter(Boolean);

                  return (
                    <div key={`${certificate.name}-${index}`} className="rounded-lg border bg-muted/20 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-medium">{certificate.name}</h3>
                        {certificate.verified ? <Badge variant="outline">Verified</Badge> : null}
                      </div>
                      {imageUrls.length ? (
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          {imageUrls.map((src) => (
                            <div key={src} className="relative h-28 overflow-hidden rounded-lg border bg-background">
                              <Image src={src} alt={certificate.name} fill className="object-cover" sizes="160px" />
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Policies Section */}
          {policies.length > 0 && (
            <div>
              <div className="mb-4 flex items-center">
                <div className="bg-primary me-3 h-2 w-2 rounded-full"></div>
                <h2 className="text-lg font-semibold">{t("policies")}</h2>
              </div>
              <div className="space-y-4">
                {policies.map((policy) => (
                  <div key={policy.id} className="space-y-2">
                    <h4 className="font-medium">{policy.policyTypeName}</h4>
                    {policy.description ? (
                      hasLexicalContent(policy.description) ? (
                        <LexicalRenderer
                          content={policy.description}
                          className="text-muted-foreground text-sm leading-relaxed"
                        />
                      ) : (
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {policy.description}
                        </p>
                      )
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gallery Section */}
          {gallery.length > 0 && (
            <ServiceProviderGallerySection
              gallery={gallery}
              providerName={name}
            />
          )}
        </section>
      </div>
      <ServerFetchResult<IServiceProviderRequest[]> result={myRequestsResult}>
        {(myRequests) => (
          <ServiceProviderRequestsModalWrapper
            serviceProviderId={serviceProvider.id}
            myRequests={myRequests}
          />
        )}
      </ServerFetchResult>
    </div>
  );
};
