"use client";

import { useEffect, useMemo, useState } from "react";

import { getLocalizedReviewEligibilityMessage, type ReviewEligibilityReason, type ReviewEligibilityState, type ReviewTargetType } from "./ReviewForm";

type ReviewEligibilityInput = {
  open: boolean;
  providerId?: string | null;
  targetType: ReviewTargetType;
  providerServiceId?: string | null;
  staffId?: string | null;
  locale?: string | null;
};

type ReviewEligibilityResponse = { canReview?: boolean; reason?: ReviewEligibilityReason };

export function useReviewEligibility(input: ReviewEligibilityInput) {
  const [state, setState] = useState<ReviewEligibilityState>("unknown");
  const [reason, setReason] = useState<ReviewEligibilityReason>(null);

  const query = useMemo(() => {
    if (!input.providerId) return null;
    const params = new URLSearchParams({ eligibility: "1", targetType: input.targetType });
    if (input.providerServiceId) params.set("providerServiceId", input.providerServiceId);
    if (input.staffId) params.set("staffId", input.staffId);
    return `/api/service-providers/${input.providerId}/reviews?${params.toString()}`;
  }, [input.providerId, input.providerServiceId, input.staffId, input.targetType]);

  useEffect(() => {
    if (!input.open) { setState("unknown"); setReason(null); return; }
    if (!query) { setState("blocked"); setReason("invalid_target"); return; }

    const controller = new AbortController();
    setState("checking");
    setReason(null);

    fetch(query, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not check review eligibility.");
        return (await response.json()) as ReviewEligibilityResponse;
      })
      .then((payload) => {
        if (controller.signal.aborted) return;
        if (payload.canReview) { setState("allowed"); setReason(null); return; }
        setState("blocked");
        setReason(payload.reason || "not_booked");
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setState("unknown");
        setReason(null);
      });

    return () => controller.abort();
  }, [input.open, query]);

  return { eligibilityState: state, eligibilityMessage: getLocalizedReviewEligibilityMessage(input.locale, reason) };
}
