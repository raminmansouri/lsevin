import 'server-only';

import { getBookingFinancialBreakdown, getCompensationPolicies, getCompensationPolicyById, getProviderLedgerEntries, getRefundRequestById, getRefundRequests } from '../../lib/server/commercial-queries';
import { getCommercialDashboardSummary, getCommercialPolicyLookups } from '../../lib/server/admin-lookups';
import { getBookingPaymentPolicies, getBookingPaymentPolicyById, getBookingPaymentTerms } from '../../lib/server/payment-policy-queries';

export async function getAdminCompensationPolicies(params?: {
  search?: string;
  scopeType?: string;
  appliesTo?: string;
  active?: string;
}) {
  return getCompensationPolicies({
    search: params?.search,
    scopeType: params?.scopeType,
    appliesTo: params?.appliesTo,
    isActive: params?.active === undefined || params.active === '' ? undefined : params.active === 'true',
  });
}

export async function getAdminCompensationPolicy(policyId: string) {
  return getCompensationPolicyById(policyId);
}

export async function getAdminProviderLedgers(params?: { providerId?: string; bookingId?: string; status?: string; }) {
  return getProviderLedgerEntries(params);
}

export async function getAdminRefundRequests(params?: { status?: string; bookingId?: string; }) {
  return getRefundRequests(params);
}

export async function getAdminRefundRequest(refundRequestId: string) {
  return getRefundRequestById(refundRequestId);
}

export async function getAdminBookingFinancialBreakdown(bookingId: string) {
  return getBookingFinancialBreakdown(bookingId);
}

export async function getAdminCommercialPolicyLookups() {
  return getCommercialPolicyLookups();
}

export async function getAdminCommercialDashboardSummary() {
  return getCommercialDashboardSummary();
}


export async function getAdminBookingPaymentPolicies(params?: { search?: string; scopeType?: string; active?: string; }) {
  return getBookingPaymentPolicies({
    search: params?.search,
    scopeType: params?.scopeType,
    isActive: params?.active === undefined || params.active === '' ? undefined : params.active === 'true',
  });
}

export async function getAdminBookingPaymentPolicy(policyId: string) {
  return getBookingPaymentPolicyById(policyId);
}

export async function getAdminBookingPaymentTerms(bookingId: string) {
  return getBookingPaymentTerms(bookingId);
}
