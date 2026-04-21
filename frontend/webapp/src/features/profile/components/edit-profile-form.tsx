"use client";

import { useTransition } from "react";
import { useForm, type FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Camera, Lock, Save, ShieldCheck } from "lucide-react";
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
import { RHFSingleMediaPickerField } from "@/features/media-picker-addon";
import ProfileImagePicker from "./profile-image-picker";

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

export default function EditProfileForm({ initialData }: Props) {
    const navigate = useNavigate();
    const [isPending, startTransition] = useTransition();

    const isLocked = initialData.isProfileConfirmed;
    const { isConfirmDialogOpen, openConfirmDialog, closeConfirmDialog } =
        useEditProfileStore();

    const {
        control,
        register,
        handleSubmit,
        formState: { errors, isDirty },
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: initialData,
    });

    const inputClass = `w-full h-12 px-4 border rounded-xl focus:outline-none transition-colors ${isLocked
            ? "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
            : "border-gray-300 focus:border-[#083f30] bg-white"
        }`;

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
                        <h1 className="text-lg font-bold text-gray-900">Edit Profile</h1>
                    </div>
                </div>
            </div>

            <div className="px-5 py-6 space-y-6">
                {isLocked ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-start gap-3">
                        <Lock className="text-emerald-700 mt-0.5" size={18} />
                        <div>
                            <p className="font-semibold text-emerald-900">Profile locked</p>
                            <p className="text-sm text-emerald-800">
                                Your profile has been confirmed and can no longer be changed.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
                        <ShieldCheck className="text-amber-700 mt-0.5" size={18} />
                        <div>
                            <p className="font-semibold text-amber-900">Confirm carefully</p>
                            <p className="text-sm text-amber-800">
                                After confirmation, profile information becomes read-only.
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex flex-col items-center">
                    <div className="relative">
                        {/* <div className="w-24 h-24 rounded-full overflow-hidden bg-white">
                            <img
                                src="/unsplash_images/photo-1494790108377-be9c29b29330__w=200&h=200&fit=crop.jpg"
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />

                        </div>
                        <button
                            type="button"
                            disabled
                            className="absolute bottom-0 right-0 w-9 h-9 bg-gray-300 rounded-full flex items-center justify-center shadow-lg cursor-not-allowed"
                        >
                            <Camera size={16} className="text-white" />
                        </button> */}
                        
                        <ProfileImagePicker
                            imageUrl={initialData.profileImageUrl}
                            mediaId={''}
                            fullName={`${initialData.firstName} ${initialData.lastName}`}
                            isLocked={false}
                              bottomBarHeight={80}
                        />

                        {/* <RHFSingleMediaPickerField
                        control={control}
                        name={'firstName'}
                        label="Thumbnail"
                        placeholder="Pick image"
                        mediaType="image"
                        helperText="Stores one media id in a hidden input."
                        modalTitle="Pick thumbnail"
                        key={'profileImage'}
            
            
                      /> */}
                    </div>
                    {/* <p className="text-sm text-gray-600 mt-2">Change profile photo</p> */}
                </div>

                <div className="bg-white rounded-2xl p-5 space-y-5">
                    <Field label="First Name" error={errors.firstName}>
                        <input
                            type="text"
                            {...register("firstName")}
                            disabled={isLocked || isPending}
                            className={inputClass}
                        />
                    </Field>

                    <Field label="Last Name" error={errors.lastName}>
                        <input
                            type="text"
                            {...register("lastName")}
                            disabled={isLocked || isPending}
                            className={inputClass}
                        />
                    </Field>

                    <Field label="Email Address" error={errors.email}>
                        <input
                            type="email"
                            {...register("email")}
                            disabled={isLocked || isPending}
                            className={inputClass}
                        />
                    </Field>

                    <div className="grid grid-cols-3 gap-3">
                        <Field label="Code" error={errors.phoneCountryCode}>
                            <input
                                type="text"
                                {...register("phoneCountryCode")}
                                disabled={isLocked || isPending}
                                placeholder="+1"
                                className={inputClass}
                            />
                        </Field>

                        <div className="col-span-2">
                            <Field label="Phone Number" error={errors.phoneNumber}>
                                <input
                                    type="tel"
                                    {...register("phoneNumber")}
                                    disabled={isLocked || isPending}
                                    className={inputClass}
                                />
                            </Field>
                        </div>
                    </div>

                    <Field label="Date of Birth" error={errors.dateOfBirth}>
                        <input
                            type="date"
                            {...register("dateOfBirth")}
                            disabled={isLocked || isPending}
                            className={inputClass}
                        />
                    </Field>

                    <Field label="Gender" error={errors.gender}>
                        <select
                            {...register("gender")}
                            disabled={isLocked || isPending}
                            className={`${inputClass} bg-white`}
                        >
                            <option value="">Select gender</option>
                            <option value="female">Female</option>
                            <option value="male">Male</option>
                            <option value="other">Other</option>
                            <option value="prefer-not-to-say">Prefer not to say</option>
                        </select>
                    </Field>

                    <Field label="Address" error={errors.address}>
                        <input
                            type="text"
                            {...register("address")}
                            disabled={isLocked || isPending}
                            className={inputClass}
                        />
                    </Field>

                    <Field label="City" error={errors.city}>
                        <input
                            type="text"
                            {...register("city")}
                            disabled={isLocked || isPending}
                            className={inputClass}
                        />
                    </Field>

                    <Field label="Country" error={errors.country}>
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
                        <span>Profile Confirmed</span>
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
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={20} />
                                    <span>Save Changes</span>
                                </>
                            )}
                        </button>

                        {/* <button
                            type="button"
                            onClick={openConfirmDialog}
                            disabled={isPending}
                            className="w-full h-12 border border-[#083f30] text-[#083f30] rounded-xl font-semibold hover:bg-[#083f30]/5 transition-all active:scale-95 disabled:opacity-50"
                        >
                            Confirm Profile
                        </button> */}
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
                                    Confirm and lock profile?
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    After confirmation, the user can no longer edit profile information.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={closeConfirmDialog}
                                className="h-12 rounded-xl border border-gray-300 font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={isPending}
                                className="h-12 rounded-xl bg-[#083f30] text-white font-semibold hover:bg-[#0a5a44] disabled:bg-gray-300"
                            >
                                {isPending ? "Please wait..." : "Yes, Confirm"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}