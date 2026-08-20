"use client";

import { useState } from "react";

import type {
  ConsultationAdminPageData,
  ConsultationRequestListItem,
} from "../../types";
import { ConsultationDetailDialog } from "./consultation-detail-dialog";
import { ConsultationFilters } from "./consultation-filters";
import { ConsultationRecipientsManager } from "./consultation-recipients-manager";
import { ConsultationRequestsTable } from "./consultation-requests-table";
import { ConsultationSmsSettingsForm } from "./consultation-sms-settings-form";
import { ConsultationStatsStrip } from "./consultation-stats-strip";

/**
 * Everything on the page is driven from one server read, so the board takes the
 * whole payload rather than each piece separately. The only state it owns is which
 * row the detail dialog is showing — filters and paging live in the URL.
 */
export function ConsultationAdminBoard({ data }: { data: ConsultationAdminPageData }) {
  const [selected, setSelected] = useState<ConsultationRequestListItem | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <ConsultationStatsStrip stats={data.stats} />

      <div className="space-y-3">
        <ConsultationFilters filters={data.filters} />
        <ConsultationRequestsTable
          list={data.list}
          onView={(row) => {
            setSelected(row);
            setOpen(true);
          }}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ConsultationRecipientsManager recipients={data.recipients} />
        <ConsultationSmsSettingsForm settings={data.smsSettings} />
      </div>

      <ConsultationDetailDialog
        row={selected}
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setSelected(null);
        }}
      />
    </div>
  );
}
