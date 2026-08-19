import { NextResponse } from "next/server";
import type { ExtendedModuleDefinition } from "@core/modules/types";
import { BookingsPage } from "./pages/BookingsPage";
import { listProviderBookings } from "./repository";

const bookingsModule: ExtendedModuleDefinition = {
  id: "provider-bookings",
  name: "Provider Bookings",
  version: "2.1.0",
  kind: "extended-module",
  dependsOn: ["core"],
  basePath: "src/modules/bookings",
  routes: [{ key: "provider.bookings", scope: "provider", path: "providers/:providerId/bookings", title: "Bookings", icon: "file", providerPermission: "manageBookings", component: BookingsPage }],
  apiRoutes: [{ key: "api.provider.bookings", method: "GET", path: "providers/:providerId/bookings", providerPermission: "view", handler: async ({ params }) => NextResponse.json(await listProviderBookings(params.providerId)) }],
  navigation: [{ scope: "provider", label: "Bookings", hrefTemplate: "/providers/:providerId/bookings", icon: "file", routeKey: "provider.bookings", providerPermission: "manageBookings", order: 80 }],
};
export default bookingsModule;
