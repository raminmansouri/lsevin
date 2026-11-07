import type { SeedFaqFile, SeedPageFile } from "./index";

import aboutUsPage from "./content/pages/about-us.json";
import servicesPage from "./content/pages/services.json";
import contactUsPage from "./content/pages/contact-us.json";
import licensesCertificationsPage from "./content/pages/licenses-certifications.json";
import pricingFeesPage from "./content/pages/pricing-fees.json";
import shippingDeliveryPage from "./content/pages/shipping-delivery.json";
import returnsRefundsPage from "./content/pages/returns-refunds.json";
import termsConditionsPage from "./content/pages/terms-conditions.json";
import privacyPolicyPage from "./content/pages/privacy-policy.json";

import homeFaq from "./content/faqs/home.json";
import exploreFaq from "./content/faqs/explore.json";
import searchFaq from "./content/faqs/search.json";
import mapFaq from "./content/faqs/map.json";
import categoriesFaq from "./content/faqs/categories.json";
import providerFaq from "./content/faqs/provider.json";
import specialistFaq from "./content/faqs/specialist.json";
import serviceFaq from "./content/faqs/service.json";
import shopFaq from "./content/faqs/shop.json";
import toursFaq from "./content/faqs/tours.json";
import gymFaq from "./content/faqs/gym.json";

/** Seed page files in footer order (SITE_PAGE_SLUGS). */
export const SEED_PAGE_FILES = [
  aboutUsPage,
  servicesPage,
  contactUsPage,
  licensesCertificationsPage,
  pricingFeesPage,
  shippingDeliveryPage,
  returnsRefundsPage,
  termsConditionsPage,
  privacyPolicyPage,
] as unknown as SeedPageFile[];

export const SEED_FAQ_FILES = [
  homeFaq,
  exploreFaq,
  searchFaq,
  mapFaq,
  categoriesFaq,
  providerFaq,
  specialistFaq,
  serviceFaq,
  shopFaq,
  toursFaq,
  gymFaq,
] as unknown as SeedFaqFile[];
