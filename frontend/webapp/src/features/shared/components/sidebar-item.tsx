"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSelectedLayoutSegments } from "next/navigation";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import useDirection from "@/hooks/use-direction";
import { Link } from "@/i18n/navigation";

import { AdminSidebarItemType } from "../types/common";

export function AdminSidebarItem({ item }: { item: AdminSidebarItemType }) {
  const segments = useSelectedLayoutSegments();
  const { isRtl } = useDirection();
  const t = useTranslations("Admin");

  // Properly handle routes regardless of language prefix
  const isActive = isRouteActive(item.url, segments);
  const isChildActive = item.items?.some((subItem) =>
    isRouteActive(subItem.url, segments)
  );

  // Determine if the collapsible should be open by default
  const defaultOpen = isActive || isChildActive;

  if (item.items && item.items.length > 0) {
    // Render Collapsible for items with children
    return (
      <Collapsible
        key={item.title}
        title={t(item.title)}
        defaultOpen={defaultOpen} // Open if parent or child is active
        className="group/collapsible"
      >
        <SidebarGroup>
          <SidebarGroupLabel
            asChild
            className="group/label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm"
          >
            <CollapsibleTrigger>
              {t(item.title)}{" "}
              {isRtl ? (
                <ChevronLeft className="mr-auto size-4 transition-transform group-data-[state=open]/collapsible:-rotate-90" />
              ) : (
                <ChevronRight className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
              )}
            </CollapsibleTrigger>
          </SidebarGroupLabel>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((subItem) => (
                  <SidebarMenuItem key={subItem.title}>
                    <Link href={subItem.url}>
                      <SidebarMenuButton
                        isActive={isRouteActive(subItem.url, segments)}
                      >
                        {t(subItem.title)}
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    );
  } else {
    // Render direct link for items without children
    return (
      <SidebarGroup key={item.title}>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href={item.url}>
              <SidebarMenuButton isActive={isActive}>
                {t(item.title)}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    );
  }
}

// Helper function to check if a route is active regardless of language prefix
function isRouteActive(url: string, segments: string[]): boolean {
  // Remove leading slash if present to normalize
  const normalizedUrl = url.startsWith("/") ? url.slice(1) : url;

  if (normalizedUrl === "") {
    // Home route "/"
    return segments.length === 0;
  }

  if (normalizedUrl === "#") {
    // Special case for parent items with "#" URLs
    return false;
  }

  // Split URL into segments for comparison
  const urlSegments = normalizedUrl.split("/").filter(Boolean);

  // For "/admin" or similar top-level routes
  if (urlSegments.length === 1 && segments.length >= 1) {
    return segments[0] === urlSegments[0];
  }

  // For nested routes, compare segment by segment
  if (urlSegments.length <= segments.length) {
    return urlSegments.every((segment, i) => segment === segments[i]);
  }

  return false;
}
