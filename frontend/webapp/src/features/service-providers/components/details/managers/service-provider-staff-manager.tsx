"use client";

import { useState, useTransition } from "react";
import { Edit, Plus, Trash2, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { LexicalRenderer } from "@/components/editor/lexical-renderer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { localeToHeader } from "@/config/locales";
import { LocalizedInput } from "@/features/shared/components/LocalizedInput";
import {
  createEmptyLocalizedContent,
  getLocalizedValue,
  normalizeLocalizedFields,
} from "@/features/shared/utils/localization";
import useAction from "@/hooks/use-action";
import { useConfirm } from "@/hooks/use-confirm";
import { LocaleTypes } from "@/types/common";

import { addProviderStaffAction } from "../../../actions/add-provider-staff";
import { removeProviderStaffAction } from "../../../actions/remove-provider-staff";
import { updateProviderStaffAction } from "../../../actions/update-provider-staff";
import { ServiceProviderStaff } from "../../../types";
import { TRANSLATION_KEY } from "../../../types/constants";
import StaffSelectorWithInfiniteScroll from "./staff-selector-with-infinite-scroll";

interface ServiceProviderStaffManagerProps {
  serviceProviderId: string;
  currentStaff?: ServiceProviderStaff[];
  onUpdate?: () => void;
}

export default function ServiceProviderStaffManager({
  serviceProviderId,
  currentStaff = [],
  onUpdate,
}: ServiceProviderStaffManagerProps) {
  const t = useTranslations(TRANSLATION_KEY);
  const locale = useLocale();
  const localeHeader = localeToHeader(locale as LocaleTypes);
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newStaff, setNewStaff] = useState({
    staffId: "",
    notes: createEmptyLocalizedContent(),
  });
  const [editFormData, setEditFormData] = useState({
    staffId: "",
    newStaffId: "",
    isActive: true,
    notes: createEmptyLocalizedContent(),
  });

  const { execute: executeAdd } = useAction(addProviderStaffAction, {
    startTransition,
    onSuccess: () => {
      toast.success(t("staff.messages.addSuccess"));
      setIsAdding(false);
      setNewStaff({
        staffId: "",
        notes: createEmptyLocalizedContent(),
      });
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(error?.detail || t("staff.messages.addError"));
    },
  });

  const { execute: executeRemove } = useAction(removeProviderStaffAction, {
    startTransition,
    onSuccess: () => {
      toast.success(t("staff.messages.removeSuccess"));
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(error?.detail || t("staff.messages.removeError"));
    },
  });

  const { execute: executeUpdate } = useAction(updateProviderStaffAction, {
    startTransition,
    onSuccess: () => {
      toast.success(t("staff.messages.updateSuccess"));
      setEditingId(null);
      setEditFormData({
        staffId: "",
        newStaffId: "",
        isActive: true,
        notes: createEmptyLocalizedContent(),
      });
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(error?.detail || t("staff.messages.updateError"));
    },
  });

  const [ConfirmDialog, confirm] = useConfirm(
    t("staff.removeDialog.title"),
    t("staff.removeDialog.description")
  );

  const handleAdd = () => {
    if (!newStaff.staffId) {
      toast.error(t("staff.messages.staffSelectionRequired"));
      return;
    }

    // Normalize localized content (notes is optional)
    const normalizedFields = normalizeLocalizedFields({
      notes: newStaff.notes,
    });

    executeAdd({
      serviceProviderId,
      staffId: newStaff.staffId,
      isActive: true,
      notes: normalizedFields.notes,
    });
  };

  const handleRemove = async (staff: ServiceProviderStaff) => {
    const ok = await confirm();
    if (ok) {
      executeRemove({
        serviceProviderId,
        staffId: staff.staffId,
      });
    }
  };

  const handleEditClick = (staff: ServiceProviderStaff) => {
    setEditingId(staff.staffId);
    setEditFormData({
      staffId: staff.staffId,
      newStaffId: staff.staffId,
      isActive: staff.isActive,
      notes: staff.notes || createEmptyLocalizedContent(),
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({
      staffId: "",
      newStaffId: "",
      isActive: true,
      notes: createEmptyLocalizedContent(),
    });
  };

  const handleUpdateStaff = () => {
    // Normalize localized content (notes is optional)
    const normalizedFields = normalizeLocalizedFields({
      notes: editFormData.notes,
    });

    executeUpdate({
      serviceProviderId,
      staffId: editFormData.staffId,
      isActive: editFormData.isActive,
      notes: normalizedFields.notes,
      newStaffId: editFormData.newStaffId || undefined,
    });
  };

  return (
    <div className="space-y-6 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t("staff.title")}</h3>
          <p className="text-muted-foreground text-sm">
            {t("staff.description")}
          </p>
        </div>
        <Button
          onClick={() => setIsAdding(true)}
          disabled={isPending || isAdding}
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("staff.actions.add")}
        </Button>
      </div>

      {/* Existing staff */}
      <div className="grid gap-3">
        {currentStaff.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-muted-foreground text-center">
                <Users className="mx-auto mb-2 h-8 w-8" />
                <p>{t("staff.noStaff")}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          currentStaff.map((staff) => (
            <Card key={staff.staffId}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  {editingId === staff.staffId ? (
                    // Edit Mode
                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">{staff.staffName}</h4>
                        {staff.staffTitle && (
                          <p className="text-muted-foreground text-sm">
                            {staff.staffTitle}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>{t("staff.form.staffMember")}</Label>
                          <StaffSelectorWithInfiniteScroll
                            value={editFormData.newStaffId}
                            onValueChange={(value) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                newStaffId: value || "",
                              }))
                            }
                            disabled={isPending}
                            placeholder={t("staff.form.selectStaff")}
                            excludeIds={currentStaff
                              .filter((s) => s.staffId !== staff.staffId)
                              .map((s) => s.staffId)}
                          />
                        </div>

                        <div className="space-y-2">
                          <LocalizedInput
                            label={t("staff.form.notes")}
                            value={editFormData.notes}
                            onChange={(value) =>
                              setEditFormData((prev) => ({
                                ...prev,
                                notes: value,
                              }))
                            }
                            richText
                            rows={3}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleUpdateStaff}
                          disabled={isPending || !editFormData.newStaffId}
                        >
                          {t("staff.actions.save")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelEdit}
                          disabled={isPending}
                        >
                          {t("staff.actions.cancel")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div className="flex-1 space-y-2">
                        <h4 className="font-medium">{staff.staffName}</h4>
                        {staff.staffTitle && (
                          <p className="text-muted-foreground text-sm">
                            {staff.staffTitle}
                          </p>
                        )}
                        {staff.notes && (
                          <div className="mt-2">
                            <div className="text-muted-foreground text-sm">
                              <strong>{t("staff.form.notes")}:</strong>{" "}
                              <LexicalRenderer
                                content={getLocalizedValue(
                                  staff.notes,
                                  localeHeader
                                )}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(staff)}
                          disabled={isPending}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(staff)}
                          disabled={isPending}
                        >
                          <Trash2 className="text-destructive h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add staff form */}
      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("staff.add.title")}</CardTitle>
            <CardDescription>{t("staff.add.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t("staff.form.staffMember")}</Label>
              <StaffSelectorWithInfiniteScroll
                value={newStaff.staffId}
                onValueChange={(value) =>
                  setNewStaff((prev) => ({ ...prev, staffId: value || "" }))
                }
                disabled={isPending}
                placeholder={t("staff.form.selectStaff")}
                excludeIds={currentStaff.map((staff) => staff.staffId)}
              />
            </div>
            <div>
              <Label>{t("staff.form.notes")}</Label>
              <LocalizedInput
                richText
                value={newStaff.notes}
                onChange={(value) =>
                  setNewStaff((prev) => ({ ...prev, notes: value }))
                }
                label={t("staff.form.notesPlaceholder")}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={isPending}>
                {t("staff.actions.add")}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setNewStaff({
                    staffId: "",
                    notes: createEmptyLocalizedContent(),
                  });
                }}
                disabled={isPending}
              >
                {t("staff.actions.cancel")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog />
    </div>
  );
}
