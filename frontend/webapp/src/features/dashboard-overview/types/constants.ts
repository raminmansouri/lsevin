// Translation namespace for dashboard
export const DASHBOARD_TRANSLATION_KEY = "Dashboard";

// Default values for data fetching
export const DASHBOARD_RECENT_ITEMS_LIMIT = 5;
export const DASHBOARD_STATS_CACHE_TTL = 300; // 5 minutes

// Dashboard quick actions configuration
export const QUICK_ACTIONS = [
  {
    title: "Consultings",
    description: "Manage consulting requests",
    href: "/admin/consulting",
    icon: "MessageSquare",
    countKey: "totalConsultings" as const,
    hasAdd: false,
  },
  {
    title: "Service Providers",
    description: "Manage service providers",
    href: "/admin/service-providers",
    icon: "Building2",
    countKey: "totalServiceProviders" as const,
    hasAdd: true,
  },
  {
    title: "Categories",
    description: "Manage service categories",
    href: "/admin/categories",
    icon: "FolderTree",
    countKey: "totalCategories" as const,
    hasAdd: true,
  },
  {
    title: "Staff",
    description: "Manage staff members",
    href: "/admin/staff",
    icon: "Users",
    countKey: "totalStaff" as const,
    hasAdd: true,
  },
  {
    title: "Provider Types",
    description: "Manage provider types",
    href: "/admin/provider-types",
    icon: "Tags",
    countKey: "totalProviderTypes" as const,
    hasAdd: true,
  },
  {
    title: "Service Definitions",
    description: "Manage service definitions",
    href: "/admin/service-definitions",
    icon: "Settings",
    countKey: "totalServiceDefinitions" as const,
    hasAdd: true,
  },
] as const;

// Stats card configuration
export const STATS_CARDS_CONFIG = [
  {
    key: "totalConsultings" as const,
    title: "Total Consultings",
    icon: "MessageSquare",
    href: "/admin/consulting",
    description: "Active consulting requests",
  },
  {
    key: "pendingServiceProviderRequests" as const,
    title: "Pending Requests",
    icon: "Clock",
    href: "/admin/service-providers-request",
    description: "Awaiting approval",
  },
  {
    key: "totalServiceProviders" as const,
    title: "Service Providers",
    icon: "Building2",
    href: "/admin/service-providers",
    description: "Registered providers",
  },
  {
    key: "totalStaff" as const,
    title: "Staff Members",
    icon: "Users",
    href: "/admin/staff",
    description: "Active staff",
  },
] as const;
