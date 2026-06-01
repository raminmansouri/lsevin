"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useForm, type FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Lock, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { useNavigate } from "@/hooks/use-navigate";
import {
    confirmProfileAction,
    updateProfileAction,
} from "../actions/profile.actions";
import {
    profileFormSchema,
    type EditProfileInitialData,
    type ProfileFormValues,
} from "../schemas/profile.schema";
import { useEditProfileStore } from "../stores/edit-profile.store";
import ProfileImagePicker from "./profile-image-picker";
import { TRANSLATION_KEY } from "../actions/update-base-info/types";

type Props = {
    initialData: EditProfileInitialData;
};

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: FieldError;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
                {label}
            </label>
            {children}
            {error?.message ? (
                <p className="mt-2 text-sm text-red-600">{error.message}</p>
            ) : null}
        </div>
    );
}

function formatLockedPhonePart(value: string) {
    const normalized = value.trim();
    if (!normalized) return "";
    return /^\d+$/.test(normalized) ? `+${normalized}` : normalized;
}

export default function EditProfileForm({ initialData }: Props) {
    const navigate = useNavigate();
    const t = useTranslations(TRANSLATION_KEY);
    const [isPending, startTransition] = useTransition();

    const isLocked = initialData.isProfileConfirmed;
    const { isConfirmDialogOpen, closeConfirmDialog } =
        useEditProfileStore();

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            firstName: initialData.firstName,
            lastName: initialData.lastName,
            email: initialData.email,
            dateOfBirth: initialData.dateOfBirth,
            gender: initialData.gender,
            address: initialData.address,
            city: initialData.city,
            country: initialData.country,
        },
    });

    const inputClass = `w-full h-12 px-4 border rounded-xl focus:outline-none transition-colors ${isLocked
            ? "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
            : "border-gray-300 focus:border-[#083f30] bg-white"
        }`;
    const lockedInputClass = "w-full h-12 px-4 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed";

    const handleSave = handleSubmit((values) => {
        startTransition(async () => {
            const result = await updateProfileAction(values);

            if (!result.ok) {
                toast.error(result.message);
                return;
            }

            toast.success(result.message);
        });
    });

    const handleConfirm = handleSubmit((values) => {
        startTransition(async () => {
            const saveResult = await updateProfileAction(values);

            if (!saveResult.ok) {
                toast.error(saveResult.message);
                return;
            }

            const confirmResult = await confirmProfileAction();

            if (!confirmResult.ok) {
                toast.error(confirmResult.message);
                return;
            }

            toast.success(confirmResult.message);
            closeConfirmDialog();
            navigate(-1);
        });
    });

    return (
        <div className="min-h-screen bg-gray-50 pb-32">
            <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors active:scale-95"
                        >
                            <ArrowLeft size={20} className="text-gray-900" />
                        </button>
                        <h1 className="text-lg font-bold text-gray-900">{t("edit.title")}</h1>
                    </div>
                </div>
            </div>

            <div className="px-5 py-6 space-y-6">
                {isLocked ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-start gap-3">
                        <Lock className="text-emerald-700 mt-0.5" size={18} />
                        <div>
                            <p className="font-semibold text-emerald-900">{t("edit.lockedTitle")}</p>
                            <p className="text-sm text-emerald-800">
                                {t("edit.lockedDescription")}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
                        <ShieldCheck className="text-amber-700 mt-0.5" size={18} />
                        <div>
                            <p className="font-semibold text-amber-900">{t("edit.confirmCarefullyTitle")}</p>
                            <p className="text-sm text-amber-800">
                                {t("edit.confirmCarefullyDescription")}
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex flex-col items-center">
                    <div className="relative">
                        <ProfileImagePicker
                            imageUrl={initialData.profileImageUrl}
                            mediaId={""}
                            fullName={`${initialData.firstName} ${initialData.lastName}`}
                            isLocked={isLocked}
                            bottomBarHeight={80}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 space-y-5">
                    <Field label={t("form.firstName.label")} error={errors.firstName}>
                        <input
                            type="text"
                            {...register("firstName")}
                            disabled={isLocked || isPending}
                            className={inputClass}
                        />
                    </Field>

                    <Field label={t("form.lastName.label")} error={errors.lastName}>
                        <input
                            type="text"
                            {...register("lastName")}
                            disabled={isLocked || isPending}
                            className={inputClass}
                        />
                    </Field>

                    <Field label={t("form.email.label")} error={errors.email}>
                        <input
                            type="email"
                            {...register("email")}
                            disabled={isLocked || isPending}
                            className={inputClass}
                        />
                    </Field>

                    {/* <div className="grid grid-cols-3 gap-3">
                        <Field label="Code">
                            <input
                                type="text"
                                value={formatLockedPhonePart(initialData.phoneCountryCode)}
                                readOnly
                                disabled
                                className={lockedInputClass}
                            />
                        </Field>

                        <div className="col-span-2">
                            <Field label="Phone Number">
                                <input
                                    type="tel"
                                    value={initialData.phoneNumber}
                                    readOnly
                                    disabled
                                    className={lockedInputClass}
                                />
                            </Field>
                        </div>
                    </div> */}

                    <p className="-mt-2 text-xs text-gray-500">
                        {t("edit.phoneLockedDescription")}
                    </p>

                    <Field label={t("form.birthDate.label")} error={errors.dateOfBirth}>
                        <input
                            type="date"
                            {...register("dateOfBirth")}
                            disabled={isLocked || isPending}
                            className={inputClass}
                        />
                    </Field>

                    <Field label={t("form.gender.label")} error={errors.gender}>
                        <select
                            {...register("gender")}
                            disabled={isLocked || isPending}
                            className={`${inputClass} bg-white`}
                        >
                            <option value="">{t("edit.gender.select")}</option>
                            <option value="female">{t("edit.gender.female")}</option>
                            <option value="male">{t("edit.gender.male")}</option>
                            <option value="other">{t("edit.gender.other")}</option>
                            <option value="prefer-not-to-say">{t("edit.gender.preferNotToSay")}</option>
                        </select>
                    </Field>

                    <Field label={t("form.address.street")} error={errors.address}>
                        <input
                            type="text"
                            {...register("address")}
                            disabled={isLocked || isPending}
                            className={inputClass}
                        />
                    </Field>

                    <Field label={t("edit.fields.city")} error={errors.city}>
                        <input
                            type="text"
                            {...register("city")}
                            disabled={isLocked || isPending}
                            className={inputClass}
                        />
                    </Field>

                    <Field label={t("edit.fields.country")} error={errors.country}>
                        <input
                            type="text"
                            {...register("country")}
                            disabled={isLocked || isPending}
                            className={inputClass}
                        />
                    </Field>
                </div>
            </div>

            <div className="fixed bottom-17 left-0 right-0 bg-white border-t border-gray-200 px-5 py-4">
                {isLocked ? (
                    <button
                        disabled
                        className="w-full h-14 bg-gray-300 text-white rounded-xl font-bold flex items-center justify-center gap-2 cursor-not-allowed"
                    >
                        <Lock size={20} />
                        <span>{t("edit.profileConfirmed")}</span>
                    </button>
                ) : (
                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isPending || !isDirty}
                            className="w-full h-14 bg-[#083f30] text-white rounded-xl font-bold hover:bg-[#0a5a44] transition-all active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isPending ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>{t("buttons.saving")}</span>
                                </>
                            ) : (
                                <>
                                    <Save size={20} />
                                    <span>{t("buttons.saveChanges")}</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {isConfirmDialogOpen && !isLocked ? (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
                    <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                <ShieldCheck size={20} className="text-amber-700" />
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    {t("edit.confirmDialog.title")}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    {t("edit.confirmDialog.description")}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={closeConfirmDialog}
                                className="h-12 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50"
                            >{t("buttons.cancel")}</button>

                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={isPending}
                                className="h-12 rounded-xl bg-[#083f30] text-white font-semibold hover:bg-[#0a5a44] disabled:bg-gray-300"
                            >
                                {isPending ? t("buttons.pleaseWait") : t("edit.confirmDialog.confirm")}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
