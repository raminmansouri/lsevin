import { Logo } from "@/components/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

import { AdminSidebarItem } from "./sidebar-item";

interface AdminSidebarItemType {
  title: string;
  url: string;
  items?: AdminSidebarItemType[];
}

const data: AdminSidebarItemType[] = [
  {
    title: "dashboard",
    url: "/admin/dashboard",
  },
  {
    title: "consultings",
    url: "/admin/consulting",
  },
  {
    title: "serviceProvidersRequest",
    url: "/admin/service-providers-request",
  },
  {
    title: "categories",
    url: "/admin/categories",
  },
  {
    title: "serviceDefinitions",
    url: "/admin/service-definitions",
  },
  {
    title: "providerTypes",
    url: "/admin/provider-types",
  },
  {
    title: "staff",
    url: "/admin/staff",
  },
  {
    title: "serviceProviders",
    url: "/admin/service-providers",
  },
  {
    title: "bookingdrafts",
    url: "/admin/booking-drafts",
  },
  {
    title: "bookings",
    url: "/admin/bookings",
  },

  {
    title: "customers",
    url: "/admin/customers",
  },
  {
    title: "users",
    url: "/admin/identity-users",
  },
  {
    title: "loyalty",
    url: "/admin/loyalty",
  },
  {
    title: "payments",
    url: "/admin/payments",
  }, 
  {
    title: "walletpaymentintents",
    url: "/admin/wallet-payment-intents",
  },
  {
    title: "wallettransactions",
    url: "/admin/wallet-transactions",
  }, 
  {
    title: "platformdata",
    url: "/admin/platform-data",
  },{
    title: "sponsered-slider",
    url: "/admin/sponsered-slider",
  },
];

export function AdminSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader className="p-4">
        <Logo />
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {data.map((item) => (
          <AdminSidebarItem key={item.title} item={item} />
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
export const AdminSidebarSkeleton = () => {
  return (
    <div className="bg-muted/40 hidden w-64 shrink-0 border-r lg:block">
      <div className="h-header flex items-center border-b px-4">
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="p-4">
        <div className="space-y-6">
          <Skeleton className="h-5 w-32" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
          <Skeleton className="h-5 w-28" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
