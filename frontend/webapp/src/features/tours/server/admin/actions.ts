"use server";

/**
 * Server actions of the Tours administration panel.
 *
 * Every export here is a public POST endpoint (invoked by action id, not URL),
 * so each one resolves the actor from the session with requireAdmin() FIRST,
 * inside runAction — an unauthenticated or non-admin caller gets a structured
 * authentication/authorization error and nothing runs. Infrastructure failures
 * surface as `infrastructure`, never as validation errors (errors.ts).
 */
import {
  addBlackout,
  addMedia,
  addPriceRule,
  addScheduleRule,
  approveAndPublish,
  approveContent,
  createPolicyVersion,
  createTour,
  duplicateTour,
  materializeDepartures,
  moderateMedia,
  rejectSubmission,
  removeMedia,
  reorderMedia,
  saveAddons,
  saveContent,
  saveItinerary,
  saveOptions,
  submitForReview,
  updateTourCore,
  type CreateTourInput,
  type OptionInput,
  type StopInput,
  type TourCorePatch,
} from "../platform/authoring";
import { requireAdmin } from "../platform/access";
import { decideBookingRequest } from "../platform/booking";
import { fail, runAction } from "../platform/errors";
import { escalateIncident, resolveIncident } from "../ops/incidents";
import { moderateReply, moderateReview } from "../ops/reviews";

import {
  clearProviderFlag,
  deleteDestination,
  deleteGlossary,
  deleteModule,
  deleteTerm,
  grantTranslator,
  revokeTranslator,
  searchUsers,
  setProviderFlag,
  setTourPlacement,
  upsertDestination,
  upsertGlossary,
  upsertModule,
  upsertTerm,
  verifyTourAttributes,
  type DestinationInput,
  type ModuleInput,
  type TermInput,
} from "./catalog-admin";
import { createAgreement } from "./commissions";
import { decideDispute, openDispute, setAdminRole } from "./disputes";
import { requireReason, requireUuid } from "./guard";
import {
  adminCancelDeparture,
  adminDelayDeparture,
  adminDisableTracking,
  adminOverrideCapacity,
  adminSetDepartureBlocked,
  adminSetTourVisibility,
  removeBlackout,
} from "./operations";
import { rebookBooking, rebookTargets } from "./rebook";
import { saveSettings } from "./settings-admin";
import { revealBookingContact } from "./support";

type NoticeArg = { sourceLocale: string; texts: Record<string, { title: string; body: string }> };

// ----------------------------------------------------------------------------
// Tours: authoring on behalf of any provider + publication workflow
// ----------------------------------------------------------------------------

export async function createTourAction(input: CreateTourInput) {
  return runAction("admin.createTour", async () => createTour(await requireAdmin(), input));
}

export async function updateTourCoreAction(tourId: string, patch: TourCorePatch) {
  return runAction("admin.updateTourCore", async () => updateTourCore(await requireAdmin(), tourId, patch));
}

export async function saveContentAction(tourId: string, input: { locale: string; entityType?: string; entityId?: string; fields: Record<string, string | null>; submit?: boolean }) {
  return runAction("admin.saveContent", async () => saveContent(await requireAdmin(), tourId, input));
}

export async function approveContentAction(tourId: string, locale: string, fieldKeys?: string[]) {
  return runAction("admin.approveContent", async () => approveContent(await requireAdmin(), tourId, locale, { fieldKeys }));
}

export async function addMediaAction(tourId: string, input: Parameters<typeof addMedia>[2]) {
  return runAction("admin.addMedia", async () => addMedia(await requireAdmin(), tourId, input));
}

export async function removeMediaAction(tourId: string, mediaId: string) {
  return runAction("admin.removeMedia", async () => removeMedia(await requireAdmin(), tourId, mediaId));
}

export async function reorderMediaAction(tourId: string, orderedIds: string[]) {
  return runAction("admin.reorderMedia", async () => reorderMedia(await requireAdmin(), tourId, orderedIds));
}

/** M-006: a rejection must say why (shown to the provider). */
export async function moderateMediaAction(mediaId: string, decision: "approved" | "rejected", note?: string) {
  return runAction("admin.moderateMedia", async () => {
    const actor = await requireAdmin();
    if (decision !== "approved" && decision !== "rejected") throw fail.validation("invalid_decision");
    const reason = decision === "rejected" ? requireReason(note) : note?.trim() || undefined;
    return moderateMedia(actor, requireUuid(mediaId, "media_not_found"), decision, reason);
  });
}

export async function saveItineraryAction(tourId: string, locale: string, stops: StopInput[], changeSummary?: string) {
  return runAction("admin.saveItinerary", async () => saveItinerary(await requireAdmin(), tourId, locale, stops, changeSummary));
}

export async function saveOptionsAction(tourId: string, locale: string, options: OptionInput[]) {
  return runAction("admin.saveOptions", async () => saveOptions(await requireAdmin(), tourId, locale, options));
}

export async function saveAddonsAction(tourId: string, locale: string, addons: Parameters<typeof saveAddons>[3]) {
  return runAction("admin.saveAddons", async () => saveAddons(await requireAdmin(), tourId, locale, addons));
}

export async function createPolicyVersionAction(tourId: string, input: Parameters<typeof createPolicyVersion>[2]) {
  return runAction("admin.createPolicyVersion", async () => createPolicyVersion(await requireAdmin(), tourId, input));
}

export async function addScheduleRuleAction(tourId: string, input: Parameters<typeof addScheduleRule>[2]) {
  return runAction("admin.addScheduleRule", async () => addScheduleRule(await requireAdmin(), tourId, input));
}

export async function materializeDeparturesAction(tourId: string) {
  return runAction("admin.materializeDepartures", async () => materializeDepartures(await requireAdmin(), tourId));
}

export async function addBlackoutAction(tourId: string, input: { from: string; to: string; calendar: string; reason?: string }) {
  return runAction("admin.addBlackout", async () => addBlackout(await requireAdmin(), tourId, input));
}

export async function removeBlackoutAction(input: { blackoutId: string; reason: string }) {
  return runAction("admin.removeBlackout", async () => removeBlackout(await requireAdmin(), input));
}

export async function addPriceRuleAction(tourId: string, input: Parameters<typeof addPriceRule>[2]) {
  return runAction("admin.addPriceRule", async () => addPriceRule(await requireAdmin(), tourId, input));
}

export async function submitForReviewAction(tourId: string) {
  return runAction("admin.submitForReview", async () => submitForReview(await requireAdmin(), tourId));
}

export async function approveAndPublishAction(tourId: string, note?: string) {
  return runAction("admin.approveAndPublish", async () => approveAndPublish(await requireAdmin(), tourId, note?.trim() || undefined));
}

/** AT-16: a rejection always carries a note the provider can read. */
export async function rejectSubmissionAction(tourId: string, note: string) {
  return runAction("admin.rejectSubmission", async () => rejectSubmission(await requireAdmin(), tourId, String(note ?? "").trim()));
}

export async function setTourVisibilityAction(input: { tourId: string; target: "paused" | "published" | "retired"; reason: string }) {
  return runAction("admin.setTourVisibility", async () => adminSetTourVisibility(await requireAdmin(), input));
}

export async function duplicateTourAction(tourId: string, newSlug: string) {
  return runAction("admin.duplicateTour", async () => duplicateTour(await requireAdmin(), tourId, String(newSlug ?? "").trim().toLowerCase()));
}

export async function setTourPlacementAction(tourId: string, input: { isFeatured: boolean; featuredUntil?: string | null; calendar?: string; isSponsored?: boolean }) {
  return runAction("admin.setTourPlacement", async () => setTourPlacement(await requireAdmin(), tourId, input));
}

export async function verifyTourAttributesAction(tourId: string, verified: boolean) {
  return runAction("admin.verifyTourAttributes", async () => verifyTourAttributes(await requireAdmin(), tourId, Boolean(verified)));
}

// ----------------------------------------------------------------------------
// Master data, editorial, settings, translation governance
// ----------------------------------------------------------------------------

export async function upsertTermAction(input: TermInput) {
  return runAction("admin.upsertTerm", async () => upsertTerm(await requireAdmin(), input));
}

export async function deleteTermAction(termId: string) {
  return runAction("admin.deleteTerm", async () => deleteTerm(await requireAdmin(), termId));
}

export async function upsertDestinationAction(input: DestinationInput) {
  return runAction("admin.upsertDestination", async () => upsertDestination(await requireAdmin(), input));
}

export async function deleteDestinationAction(destinationId: string) {
  return runAction("admin.deleteDestination", async () => deleteDestination(await requireAdmin(), destinationId));
}

export async function upsertModuleAction(input: ModuleInput) {
  return runAction("admin.upsertModule", async () => upsertModule(await requireAdmin(), input));
}

export async function deleteModuleAction(moduleId: string) {
  return runAction("admin.deleteModule", async () => deleteModule(await requireAdmin(), moduleId));
}

export async function saveSettingsAction(patch: Record<string, unknown>) {
  return runAction("admin.saveSettings", async () => saveSettings(await requireAdmin(), patch));
}

export async function searchUsersAction(q: string) {
  return runAction("admin.searchUsers", async () => searchUsers(await requireAdmin(), q));
}

export async function grantTranslatorAction(input: { userId: string; locale: string; serviceProviderId?: string | null }) {
  return runAction("admin.grantTranslator", async () => grantTranslator(await requireAdmin(), input));
}

export async function revokeTranslatorAction(input: { userId: string; locale: string }) {
  return runAction("admin.revokeTranslator", async () => revokeTranslator(await requireAdmin(), input));
}

export async function upsertGlossaryAction(input: { termKey: string; locale: string; value: string; note?: string | null }) {
  return runAction("admin.upsertGlossary", async () => upsertGlossary(await requireAdmin(), input));
}

export async function deleteGlossaryAction(input: { termKey: string; locale: string }) {
  return runAction("admin.deleteGlossary", async () => deleteGlossary(await requireAdmin(), input));
}

// ----------------------------------------------------------------------------
// Operations
// ----------------------------------------------------------------------------

export async function setDepartureBlockedAction(input: { departureId: string; blocked: boolean; reason: string }) {
  return runAction("admin.setDepartureBlocked", async () => adminSetDepartureBlocked(await requireAdmin(), input));
}

export async function overrideCapacityAction(input: { departureId: string; capacity: number | string; reason: string }) {
  return runAction("admin.overrideCapacity", async () => adminOverrideCapacity(await requireAdmin(), input));
}

export async function delayDepartureAction(input: { departureId: string; minutes: number | string; reason: string; notice: NoticeArg }) {
  return runAction("admin.delayDeparture", async () => adminDelayDeparture(await requireAdmin(), input));
}

export async function cancelDepartureAction(input: { departureId: string; reasonCode: string; reason: string; notice: NoticeArg }) {
  return runAction("admin.cancelDeparture", async () => adminCancelDeparture(await requireAdmin(), input));
}

export async function disableTrackingAction(input: { departureId: string; reason: string }) {
  return runAction("admin.disableTracking", async () => adminDisableTracking(await requireAdmin(), input));
}

export async function rebookTargetsAction(bookingId: string) {
  return runAction("admin.rebookTargets", async () => {
    const rows = await rebookTargets(await requireAdmin(), bookingId);
    return rows.map((r) => ({ ...r, starts_at: new Date(r.starts_at).toISOString() }));
  });
}

export async function rebookAction(input: { bookingId: string; targetDepartureId: string; reason: string }) {
  return runAction("admin.rebook", async () => rebookBooking(await requireAdmin(), input));
}

export async function decideBookingRequestAction(bookingId: string, decision: "accept" | "decline", reason?: string) {
  return runAction("admin.decideBookingRequest", async () => decideBookingRequest(await requireAdmin(), requireUuid(bookingId, "booking_not_found"), decision, reason));
}

export async function revealContactAction(input: { bookingId: string; reason: string }) {
  return runAction("admin.revealContact", async () => revealBookingContact(await requireAdmin(), input));
}

export async function openDisputeAction(input: { bookingId: string; kind: string; reasonCode: string; amount?: number | string | null; notes: string }) {
  return runAction("admin.openDispute", async () => openDispute(await requireAdmin(), input));
}

export async function decideDisputeAction(input: { disputeId: string; decision: "approve" | "reject"; note: string }) {
  return runAction("admin.decideDispute", async () => decideDispute(await requireAdmin(), input));
}

export async function setAdminRoleAction(input: { userId: string; role: string }) {
  return runAction("admin.setAdminRole", async () => setAdminRole(await requireAdmin(), input));
}

export async function createAgreementAction(input: { serviceProviderId?: string | null; percent: number | string; effectiveFrom: string; effectiveTo?: string | null; calendar?: string }) {
  return runAction("admin.createAgreement", async () => createAgreement(await requireAdmin(), input));
}

export async function escalateIncidentAction(incidentId: string) {
  return runAction("admin.escalateIncident", async () => escalateIncident(await requireAdmin(), requireUuid(incidentId, "incident_not_found")));
}

export async function resolveIncidentAction(incidentId: string, resolution: string) {
  return runAction("admin.resolveIncident", async () => resolveIncident(await requireAdmin(), requireUuid(incidentId, "incident_not_found"), resolution));
}

export async function moderateReviewAction(reviewId: string, decision: "published" | "rejected" | "hidden", note?: string) {
  return runAction("admin.moderateReview", async () => {
    const actor = await requireAdmin();
    const reason = decision === "published" ? note?.trim() || null : requireReason(note);
    return moderateReview(actor, requireUuid(reviewId, "review_not_found"), decision, reason);
  });
}

export async function moderateReplyAction(reviewId: string, decision: "published" | "rejected", note?: string) {
  return runAction("admin.moderateReply", async () => moderateReply(await requireAdmin(), requireUuid(reviewId, "review_not_found"), decision, note?.trim() || null));
}

export async function setProviderFlagAction(input: { serviceProviderId: string; flag: string; note: string }) {
  return runAction("admin.setProviderFlag", async () => setProviderFlag(await requireAdmin(), input));
}

export async function clearProviderFlagAction(flagId: string, note: string) {
  return runAction("admin.clearProviderFlag", async () => clearProviderFlag(await requireAdmin(), flagId, note));
}
