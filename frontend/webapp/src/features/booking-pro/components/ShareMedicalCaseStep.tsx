'use client';
import { useEffect, useState, useTransition } from 'react';
import { Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DATA_SCOPES } from '@/features/patients/sharing-schemas';
import { listMyShareableCasesAction, type ShareableCaseGroup } from '@/features/patients/server/customer-case-provider-actions';
import type { BookingDraftState } from '../types';

type CaseShare = NonNullable<BookingDraftState['caseShare']>;

async function patchCaseShare(draftId: string, caseShare: CaseShare | null) {
    const response = await fetch('/api/booking-pro/draft', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'caseShare', draftId, caseShare }),
        cache: 'no-store',
    });
    if (!response.ok) throw new Error(await response.text());
}

/**
 * "Share along the booking": lets the customer pick a case to share with the
 * provider they are actively booking, without leaving the wizard. This only
 * ever saves an INTENT onto the draft (booking.booking_drafts.case_share_*,
 * migration 0062) -- the real patient.case_provider_grants row is created
 * by checkoutDraft, only once the booking is actually confirmed. Nothing
 * here talks to case_provider_grants directly.
 */
export function ShareMedicalCaseStep({
    providerId,
    draftId,
    caseShare,
    onSaved,
}: {
    providerId: string | null | undefined;
    draftId: string | undefined;
    caseShare: CaseShare | null | undefined;
    onSaved: (caseShare: CaseShare | null) => void;
}) {
    const t = useTranslations('Booking');
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [groups, setGroups] = useState<ShareableCaseGroup[] | null>(null);
    const [patientId, setPatientId] = useState(caseShare?.patientId ?? '');
    const [medicalCaseId, setMedicalCaseId] = useState(caseShare?.medicalCaseId ?? '');
    const [permission, setPermission] = useState<'view' | 'contribute'>(caseShare?.permission ?? 'view');
    const [scope, setScope] = useState<string[]>(caseShare?.scope ?? []);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (groups !== null) return;
        setLoading(true);
        listMyShareableCasesAction().then((result) => {
            const data = result.ok && result.data ? result.data : [];
            setGroups(data);
            if (!caseShare) {
                const firstGroup = data[0];
                if (firstGroup) {
                    setPatientId(firstGroup.patientId);
                    setMedicalCaseId(firstGroup.cases[0]?.id ?? '');
                }
            }
            setLoading(false);
        });
        // Only ever fetched once per mount -- caseShare is only read for its
        // initial value here, re-running this on every caseShare change would
        // refetch on our own save.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groups]);

    if (!providerId || !draftId) return null;

    const selectedGroup = groups?.find((group) => group.patientId === patientId);
    const sharedCaseTitle = caseShare
        ? groups?.flatMap((group) => group.cases).find((c) => c.id === caseShare.medicalCaseId)?.title
        : undefined;
    const toggleScope = (value: string) => setScope((prev) => (prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]));

    const save = () => {
        if (!medicalCaseId || !patientId || scope.length === 0) return;
        setError(null);
        const next: CaseShare = { patientId, medicalCaseId, permission, scope };
        startTransition(async () => {
            try {
                await patchCaseShare(draftId, next);
                onSaved(next);
                setOpen(false);
            } catch {
                setError(t('caseShareFailed'));
            }
        });
    };

    const remove = () => {
        setError(null);
        startTransition(async () => {
            try {
                await patchCaseShare(draftId, null);
                onSaved(null);
                setOpen(false);
            } catch {
                setError(t('caseShareFailed'));
            }
        });
    };

    return (
        <div className="mt-6 rounded-3xl border border-[#083f30]/15 bg-[#083f30]/5 p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#083f30]/10 text-[#083f30]">
                        <Share2 className="h-4 w-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">{t('shareMedicalCaseWithProvider')}</h3>
                        <p className="mt-1 text-xs leading-5 text-slate-600">{t('shareMedicalCaseDescription')}</p>
                    </div>
                </div>
                {!open && !caseShare && (
                    <button type="button" onClick={() => setOpen(true)} className="shrink-0 rounded-xl bg-[#083f30] px-3 py-2 text-xs font-bold text-white">
                        {t('shareThisCase')}
                    </button>
                )}
            </div>

            {!open && caseShare && (
                <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-emerald-700">{t('caseShareSavedPending', { title: sharedCaseTitle ?? caseShare.medicalCaseId })}</p>
                    <div className="flex shrink-0 gap-2">
                        <button type="button" onClick={() => setOpen(true)} className="text-xs font-bold text-[#083f30]">
                            {t('changeSelection')}
                        </button>
                        <button type="button" disabled={isPending} onClick={remove} className="text-xs font-bold text-red-600 disabled:opacity-50">
                            {t('removeSelection')}
                        </button>
                    </div>
                </div>
            )}

            {open && (
                <div className="mt-4 space-y-3">
                    {loading && <p className="text-xs text-slate-500">…</p>}
                    {!loading && groups && groups.length === 0 && <p className="text-xs text-slate-500">{t('noCasesToShare')}</p>}
                    {!loading && groups && groups.length > 0 && (
                        <>
                            {groups.length > 1 && (
                                <div>
                                    <label className="text-xs text-slate-500">{t('selectPatient')}</label>
                                    <select
                                        value={patientId}
                                        onChange={(event) => {
                                            const nextPatientId = event.target.value;
                                            setPatientId(nextPatientId);
                                            const nextGroup = groups.find((group) => group.patientId === nextPatientId);
                                            setMedicalCaseId(nextGroup?.cases[0]?.id ?? '');
                                        }}
                                        className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                                    >
                                        {groups.map((group) => (
                                            <option key={group.patientId} value={group.patientId}>
                                                {group.patientName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="text-xs text-slate-500">{t('selectCase')}</label>
                                <select
                                    value={medicalCaseId}
                                    onChange={(event) => setMedicalCaseId(event.target.value)}
                                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
                                >
                                    {selectedGroup?.cases.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.title} ({c.caseNumber})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500">{t('accessLevel')}</label>
                                <div className="mt-1 flex gap-3 text-sm text-slate-700">
                                    <label className="flex items-center gap-1.5">
                                        <input type="radio" checked={permission === 'view'} onChange={() => setPermission('view')} />
                                        {t('viewOnlyAccess')}
                                    </label>
                                    <label className="flex items-center gap-1.5">
                                        <input type="radio" checked={permission === 'contribute'} onChange={() => setPermission('contribute')} />
                                        {t('viewAndAddResultsAccess')}
                                    </label>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">{t('dataToShare')}</p>
                                <div className="mt-1 grid grid-cols-2 gap-1.5 text-xs text-slate-700">
                                    {DATA_SCOPES.map((value) => (
                                        <label key={value} className="flex items-center gap-1.5">
                                            <input type="checkbox" checked={scope.includes(value)} onChange={() => toggleScope(value)} />
                                            {t(value)}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {error && <p className="text-xs text-red-600">{error}</p>}
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={save}
                                    disabled={isPending || !medicalCaseId || scope.length === 0}
                                    className="rounded-xl bg-[#083f30] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                                >
                                    {t('shareCaseButton')}
                                </button>
                                <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600">
                                    {t('cancel')}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
