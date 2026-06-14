import { IConsulting } from "@/features/consulting/types";
import { IServiceProviderRequestAdmin } from "@/features/service-providers/types";

// Dashboard Statistics Interface
export interface DashboardStats {
  totalConsultings: number;
  totalServiceProviders: number;
  totalCategories: number;
  totalStaff: number;
  totalProviderTypes: number;
  totalServiceDefinitions: number;
  pendingServiceProviderRequests: number;
  pendingConsultingRequests: number;
}

// Recent Activity Data
export interface DashboardRecentActivity {
  recentConsultings: IConsulting[];
  recentServiceProviderRequests: IServiceProviderRequestAdmin[];
}

// Combined Dashboard Data
export interface DashboardData {
  stats: DashboardStats;
  recentActivity: DashboardRecentActivity;
}

// Quick Action Item
export interface QuickActionItem {
  title: string;
  description: string;
  href: string;
  icon: string;
  count?: number;
}

// Dashboard Card Data for Stats
export interface DashboardStatsCard {
  title: string;
  value: number;
  href: string;
  icon: string;
  description: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}
