"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import type { GymMembershipMonthAdminRow, GymMembershipsAdminPageData } from "../../types";
import { GYM_MEMBERSHIPS_TRANSLATION_KEY } from "../../types";
import { GymMembershipMonthFilters } from "./gym-membership-month-filters";
import { GymMembershipMonthReviewDialog } from "./gym-membership-month-review-dialog";
import { GymMembershipMonthsTable } from "./gym-membership-months-table";
import { GymMembershipPlansManager } from "./gym-membership-plans-manager";

/** Everything on the page is driven from one server read, so the board takes the whole
 * payload rather than each piece separately -- mirrors consultation-admin-board.tsx. The
 * only state it owns is which month row the review dialog is showing; filters and paging
 * live in the URL. */
export function GymMembershipsAdminBoard({ data }: { data: GymMembershipsAdminPageData }) {
  const t = useTranslations(GYM_MEMBERSHIPS_TRANSLATION_KEY);
  const [selected, setSelected] = useState<GymMembershipMonthAdminRow | null>(null);

  return (
    <div className="space-y-6">
      <GymMembershipPlansManager plans={data.plans} />

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">{t("admin.months.title")}</h2>
        <GymMembershipMonthFilters filters={data.filters} />
        <GymMembershipMonthsTable list={data.months} onReview={(row) => setSelected(row)} />
      </div>

      <GymMembershipMonthReviewDialog
        row={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        onReviewed={() => setSelected(null)}
      />
    </div>
  );
}
