
import type { ExtendedModuleDefinition } from "@core/modules/types";
import { ProviderPage } from "./pages/ProviderPage";
import { AdminPage } from "./pages/AdminPage";
import { StaffBookingsPage } from "./pages/StaffBookingsPage";

const moduleDefinition: ExtendedModuleDefinition = {
  id: "booking-management",
  name: "Booking Management",
  version: "1.1.0",
  kind: "extended-module",
  dependsOn: ["core"],
  basePath: "src/modules/booking-management",
  databaseSchema: "booking_management",
  installMode: "optional",
  capabilities: ["booking.read_provider_bookings", "booking.update_status", "booking.assign_staff", "booking.add_provider_note", "booking.export_calendar"],
  migrations: ["migrations/001_booking_management.sql", "migrations/002_booking_management_hardening.sql", "migrations/003_booking_change_workflow.sql"],
  routes: [
    { key: "booking-management.provider", scope: "provider", path: "providers/:providerId/booking-management", title: "Booking Management", icon: "calendar", providerPermission: "manageBookings", component: ProviderPage },
    { key: "booking-management.admin", scope: "admin", path: "admin/booking-management", title: "Booking Operations", icon: "calendar", adminPermission: "PROVIDER_ADMIN", component: AdminPage },
    { key: "booking-management.staff", scope: "portal", path: "staff/:staffId/bookings", title: "My Assigned Bookings", icon: "calendar", component: StaffBookingsPage },
  ],
  navigation: [
    { scope: "provider", label: "Booking Management", hrefTemplate: "/providers/:providerId/booking-management", icon: "calendar", routeKey: "booking-management.provider", providerPermission: "manageBookings", order: 155 },
    { scope: "admin", label: "Booking Management", hrefTemplate: "/admin/booking-management", icon: "calendar", routeKey: "booking-management.admin", adminPermission: "PROVIDER_ADMIN", order: 155 },
  ],
};

export default moduleDefinition;
