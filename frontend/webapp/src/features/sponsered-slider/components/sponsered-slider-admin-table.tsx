import { useTranslations } from "next-intl";
import { Edit, ExternalLink, ImageIcon, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import type { SponseredSliderAdminRow } from "../types";
import {
  SPONSERED_SLIDER_PLACEMENT_META,
  getSponseredSliderPlacementMeta,
  normalizeSponseredSliderPlacement,
  sponseredSliderPlacementLabel,
} from "../lib/placements";
import { deleteSponseredSliderAction } from "../server/actions";

function pickTranslation(value?: Record<string, string>, fallback?: string | null) {
  return value?.["en-US"] || value?.["fa-IR"] || Object.values(value || {}).find(Boolean) || fallback || "—";
}

export function SponseredSliderAdminTable({
  rows,
  placementFilter = null,
}: {
  rows: SponseredSliderAdminRow[];
  placementFilter?: string | null;
}) {
  const tAdmin = useTranslations("AdminGenerated");

  // Rows written before `placement_key` existed carry null and render on the home
  // page, so they are counted under `home_native_ad` here too -- the list has to
  // agree with what the site actually shows.
  const countByPlacement = rows.reduce<Record<string, number>>((totals, row) => {
    const key = normalizeSponseredSliderPlacement(row.placementKey);
    totals[key] = (totals[key] || 0) + 1;
    return totals;
  }, {});

  const activeFilter = placementFilter
    ? SPONSERED_SLIDER_PLACEMENT_META.find((item) => item.key === placementFilter)?.key ?? null
    : null;

  const visibleRows = activeFilter
    ? rows.filter((row) => normalizeSponseredSliderPlacement(row.placementKey) === activeFilter)
    : rows;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">{tAdmin("sponsoredSlider")}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage image, GIF, video slides and all frontend copy from the admin panel.
          </p>
        </div>
        <Button asChild className="gap-2 rounded-2xl">
          <Link href="/admin/sponsored-slider/add">
            <Plus className="h-4 w-4" />
            Add slide
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant={activeFilter ? "outline" : "default"} className="rounded-full">
          <Link href="/admin/sponsored-slider">
            {tAdmin("allPlacements")} ({rows.length})
          </Link>
        </Button>
        {SPONSERED_SLIDER_PLACEMENT_META.map((placement) => (
          <Button
            key={placement.key}
            asChild
            size="sm"
            variant={activeFilter === placement.key ? "default" : "outline"}
            className="rounded-full"
          >
            <Link href={`/admin/sponsored-slider?placement=${placement.key}`}>
              {sponseredSliderPlacementLabel(tAdmin, placement.key)} ({countByPlacement[placement.key] || 0})
            </Link>
          </Button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>{tAdmin("slides")}</CardTitle>
          <CardDescription>
            {visibleRows.length} slide{visibleRows.length === 1 ? "" : "s"} configured.
            {activeFilter && !getSponseredSliderPlacementMeta(activeFilter)?.isMounted
              ? ` ${tAdmin("placementNotMounted")}.`
              : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">{tAdmin("order")}</TableHead>
                  <TableHead>{tAdmin("placement")}</TableHead>
                  <TableHead>{tAdmin("title")}</TableHead>
                  <TableHead>{tAdmin("eyebrow")}</TableHead>
                  <TableHead>{tAdmin("cTA")}</TableHead>
                  <TableHead>{tAdmin("status")}</TableHead>
                  <TableHead className="text-right">{tAdmin("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.displayOrder}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-full">
                        {sponseredSliderPlacementLabel(tAdmin, row.placementKey)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[320px]">
                        <div className="line-clamp-1 font-semibold text-slate-950">
                          {pickTranslation(row.titleTranslations, row.legacyTitle)}
                        </div>
                        <div className="mt-1 line-clamp-1 text-xs text-slate-500">
                          {pickTranslation(row.subtitleTranslations, row.legacySubtitle)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{pickTranslation(row.eyebrowTranslations)}</TableCell>
                    <TableCell>{pickTranslation(row.buttonLabelTranslations, row.legacyButtonLabel)}</TableCell>
                    <TableCell>
                      <Badge className="rounded-full" variant={row.isActive ? "default" : "outline"}>
                        {row.isActive ? "Active" : "Hidden"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {(row.mediaId || row.url) && (
                          <Button asChild size="icon" variant="ghost" title={tAdmin("openMedia")}>
                            <Link href={row.url || `/admin/media?selected=${row.mediaId}`} target="_blank">
                              <ImageIcon className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        {row.link && (
                          <Button asChild size="icon" variant="ghost" title={tAdmin("openLink")}>
                            <Link href={row.link} target="_blank">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        <Button asChild size="icon" variant="ghost" title={tAdmin("edit")}>
                          <Link href={`/admin/sponsored-slider/${row.id}/update`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <form action={deleteSponseredSliderAction.bind(null, row.id)}>
                          <Button size="icon" variant="ghost" className="text-red-600 hover:text-red-700" title={tAdmin("delete")}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!visibleRows.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-sm text-slate-500">
                      No sponsored slider items yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
