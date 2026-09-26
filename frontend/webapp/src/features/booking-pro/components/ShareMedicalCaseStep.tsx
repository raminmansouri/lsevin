'use client';
import { useEffect, useState, useTransition } from 'react';
import { Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DATA_SCOPES } from '@/features/patients/sharing-schemas';
import {
    createCaseProviderGrantAction,
    listMyShareableCasesAction,
    type ShareableCaseGroup,
} from '@/features/patients/server/customer-case-provider-actions';

/**
 * "Share along the booking": lets the customer grant the provider they are
 * actively booking access to one of their existing medical cases, without
 * leaving the wizard. Reuses the same customer-owned server action My Cases
 * uses (createCaseProviderGrantAction) -- this is just a second entry point
 * into it, not a new authorization mechanism. Grants created here have no
 * bookingId (the real booking.bookings row doesn't exist yet at this step),
 * same as a general consent-based share.
 */
export function ShareMedicalCaseStep({ providerId }: { providerId: string | null | undefined }) {
    const t = useTranslations('Booking');
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [groups, setGroups] = useState<ShareableCaseGroup[] | null>(null);
    const [patientId, setPatientId] = useState('');
    const [medicalCaseId, setMedicalCaseId] = useState('');
    const [permission, setPermission] = useState<'view' | 'contribute'>('view');
    const [scope, setScope] = useState<string[]>([]);
    const [sharedOk, setSharedOk] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (!open || groups !== null) return;
        setLoading(true);
        listMyShareableCasesAction().then((result) => {
            const data = result.ok && result.data ? result.data : [];
            setGroups(data);
            const firstGroup = data[0];
            if (firstGroup) {
                setPatientId(firstGroup.patientId);
                setMedicalCaseId(firstGroup.cases[0]?.id ?? '');
            }
            setLoading(false);
        });
    }, [open, groups]);

    if (!providerId) return null;

    const selectedGroup = groups?.find((group) => group.patientId === patientId);
    const toggleScope = (value: string) => setScope((prev) => (prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]));

    const share = () => {
        if (!medicalCaseId || !patientId || scope.length === 0) return;
        setError(null);
        startTransition(async () => {
            const result = await createCaseProviderGrantAction({
                patientId,
                medicalCaseId,
                providerId,
                permission,
                scope: scope as never,
            });
            if (result.ok) {
                setSharedOk(true);
                return;
            }
            setError(result.error || t('caseShareFailed'));
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
                {!open && !sharedOk && (
                    <button type="button" onClick={() => setOpen(true)} className="shrink-0 rounded-xl bg-[#083f30] px-3 py-2 text-xs font-bold text-white">
                        {t('shareThisCase')}
                    </button>
                )}
            </div>

            {sharedOk && <p className="mt-3 text-xs font-medium text-emerald-700">{t('caseSharedSuccessfully')}</p>}

            {open && !sharedOk && (
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
                                    onClick={share}
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
