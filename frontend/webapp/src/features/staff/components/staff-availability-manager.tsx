"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Calendar, Clock, Edit, Plus, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import DatePicker from "@/components/form/date-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import useAction from "@/hooks/use-action";
import { useConfirm } from "@/hooks/use-confirm";
import { formatDate } from "@/lib/formatters";

import { addStaffAvailabilityAction } from "../actions/add-staff-availability";
import { removeStaffAvailabilityAction } from "../actions/remove-staff-availability";
import { updateStaffAvailabilityAction } from "../actions/update-staff-availability";
import { useStaffDetailsCacheManagement } from "../api/client/get-staff-details-query";
import { STAFF_TRANSLATION_KEY } from "../constants";
import { DayOfWeek, StaffAvailabilityResponse, StaffDetails } from "../types";
import {
  convertIntegerToDayOfWeek,
  convertStatusIdToTranslationKey,
  getAvailabilityStatusOptions,
} from "../utils";
import { TimePicker } from "./time-picker";

interface StaffAvailabilityManagerProps {
  staff: StaffDetails;
  onUpdate?: () => void;
}

// We'll create these dynamically in the component to access translations

export function StaffAvailabilityManager({
  staff,
  onUpdate,
}: StaffAvailabilityManagerProps) {
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const t = useTranslations(STAFF_TRANSLATION_KEY);
  const { invalidateStaffCache } = useStaffDetailsCacheManagement();

  // Create localized options
  const DAY_OF_WEEK_OPTIONS = Object.values(DayOfWeek).map((day) => ({
    value: day,
    label: t(`availability.days.${day}`),
  }));

  const AVAILABILITY_STATUS_OPTIONS = getAvailabilityStatusOptions().map(
    (option) => ({
      id: option.id,
      name: t(`availability.status.${option.translationKey}`),
    })
  );

  // Form state for new availability
  const [newAvailability, setNewAvailability] = useState({
    dayOfWeek: DayOfWeek.Monday,
    startTime: "09:00:00",
    endTime: "17:00:00",
    isRecurring: true,
    availabilityStatusId: 1,
    specificDate: "",
  });

  // Form state for editing availability
  const [editFormData, setEditFormData] = useState({
    dayOfWeek: DayOfWeek.Monday,
    startTime: "09:00:00",
    endTime: "17:00:00",
    isRecurring: true,
    availabilityStatusId: 1,
    specificDate: "",
  });

  const { execute: executeAdd } = useAction(addStaffAvailabilityAction, {
    startTransition,
    onSuccess: () => {
      toast.success(t("messages.availabilityAddSuccess"));
      setIsAdding(false);
      setNewAvailability({
        dayOfWeek: DayOfWeek.Monday,
        startTime: "09:00:00",
        endTime: "17:00:00",
        isRecurring: true,
        availabilityStatusId: 1,
        specificDate: "",
      });
      invalidateStaffCache(staff.id);
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(error?.detail || t("messages.availabilityAddError"));
    },
  });

  const { execute: executeRemove } = useAction(removeStaffAvailabilityAction, {
    startTransition,
    onSuccess: () => {
      toast.success(t("messages.availabilityRemoveSuccess"));
      invalidateStaffCache(staff.id);
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(error?.detail || t("messages.availabilityRemoveError"));
    },
  });

  const { execute: executeUpdate } = useAction(updateStaffAvailabilityAction, {
    startTransition,
    onSuccess: () => {
      toast.success(t("messages.availabilityUpdateSuccess"));
      setEditingId(null);
      invalidateStaffCache(staff.id);
      onUpdate?.();
    },
    onError: (error) => {
      toast.error(error?.detail || t("messages.availabilityUpdateError"));
    },
  });

  const [ConfirmDialog, confirm] = useConfirm(
    t("availability.removeDialog.title"),
    t("availability.removeDialog.description")
  );

  const handleAdd = () => {
    executeAdd({
      staffId: staff.id,
      ...newAvailability,
      specificDate: newAvailability.isRecurring
        ? undefined
        : newAvailability.specificDate || undefined,
    });
  };

  // Helper function to handle start time change with validation
  const handleStartTimeChange = (time: string) => {
    let timeWasAdjusted = false;

    setNewAvailability((prev) => {
      const newState = { ...prev, startTime: time };

      // If new start time is >= end time, reset end time
      if (prev.endTime && compareTimeStrings(time, prev.endTime) >= 0) {
        timeWasAdjusted = true;
        // Find next available time slot after start time
        const [hour, minute] = time.split(":").map(Number);
        if (!hour || !minute) return newState;
        const nextMinute = minute + 15;
        let nextHour = hour;
        let nextMin = nextMinute;

        if (nextMinute >= 60) {
          nextHour = hour + 1;
          nextMin = 0;
        }

        if (nextHour < 24) {
          const nextTime = `${nextHour.toString().padStart(2, "0")}:${nextMin
            .toString()
            .padStart(2, "0")}:00`;
          newState.endTime = nextTime;
        } else {
          newState.endTime = "17:00:00"; // Default fallback
        }
      }

      return newState;
    });

    // Show notification if time was auto-adjusted
    if (timeWasAdjusted) {
      toast.info(t("availability.validation.timeAutoAdjusted"));
    }
  };

  // Helper function to compare times
  const compareTimeStrings = (time1: string, time2: string): number => {
    const parts1 = time1.split(":").map(Number);
    const parts2 = time2.split(":").map(Number);
    const h1 = parts1[0];
    const m1 = parts1[1];
    const h2 = parts2[0];
    const m2 = parts2[1];
    if (
      h1 === undefined ||
      m1 === undefined ||
      h2 === undefined ||
      m2 === undefined ||
      isNaN(h1) ||
      isNaN(m1) ||
      isNaN(h2) ||
      isNaN(m2)
    )
      return 0;
    const minutes1 = h1 * 60 + m1;
    const minutes2 = h2 * 60 + m2;
    return minutes1 - minutes2;
  };

  const handleRemove = async (availability: StaffAvailabilityResponse) => {
    const ok = await confirm();
    if (ok) {
      executeRemove({
        staffId: staff.id,
        availabilityId: availability.id,
      });
    }
  };

  const handleEditClick = (availability: StaffAvailabilityResponse) => {
    setEditingId(availability.id);
    setEditFormData({
      dayOfWeek:
        typeof availability.dayOfWeek === "number"
          ? convertIntegerToDayOfWeek(availability.dayOfWeek)
          : availability.dayOfWeek,
      startTime: availability.startTime,
      endTime: availability.endTime,
      isRecurring: availability.isRecurring,
      availabilityStatusId: availability.availabilityStatusId,
      specificDate: availability.specificDate || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdateAvailability = (availabilityId: string) => {
    // Validate time before updating
    if (compareTimeStrings(editFormData.startTime, editFormData.endTime) >= 0) {
      toast.error(t("availability.validation.endTimeMustBeAfterStartTime"));
      return;
    }

    executeUpdate({
      staffId: staff.id,
      availabilityId,
      ...editFormData,
      specificDate: editFormData.isRecurring
        ? undefined
        : editFormData.specificDate || undefined,
    });
  };

  // Helper function to handle edit form start time change with validation
  const handleEditStartTimeChange = (time: string) => {
    let timeWasAdjusted = false;

    setEditFormData((prev) => {
      const newState = { ...prev, startTime: time };

      // If new start time is >= end time, reset end time
      if (prev.endTime && compareTimeStrings(time, prev.endTime) >= 0) {
        timeWasAdjusted = true;
        const [hour, minute] = time.split(":").map(Number);
        if (!hour || !minute) return newState;
        const nextMinute = minute + 15;
        let nextHour = hour;
        let nextMin = nextMinute;

        if (nextMinute >= 60) {
          nextHour = hour + 1;
          nextMin = 0;
        }

        if (nextHour < 24) {
          const nextTime = `${nextHour.toString().padStart(2, "0")}:${nextMin
            .toString()
            .padStart(2, "0")}:00`;
          newState.endTime = nextTime;
        } else {
          newState.endTime = "17:00:00";
        }
      }

      return newState;
    });

    if (timeWasAdjusted) {
      toast.info(t("availability.validation.timeAutoAdjusted"));
    }
  };

  const formatTime = (timeString: string) => {
    try {
      // Convert HH:mm:ss to Date and format
      const [hours, minutes] = timeString.split(":");
      if (!hours || !minutes) return timeString;
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes), 0);
      return format(date, "HH:mm");
    } catch {
      return timeString;
    }
  };

  const getLocalizedDayName = (dayOfWeek: DayOfWeek | number): string => {
    // If it's a number, convert it to DayOfWeek enum first
    const dayName =
      typeof dayOfWeek === "number"
        ? convertIntegerToDayOfWeek(dayOfWeek)
        : dayOfWeek;

    return t(`availability.days.${dayName}`);
  };

  const getLocalizedStatusName = (statusId: number): string => {
    const statusKey = convertStatusIdToTranslationKey(statusId);
    return t(`availability.status.${statusKey}`);
  };

  const getStatusBadgeVariant = (statusId: number) => {
    switch (statusId) {
      case 1: // Available
        return "default";
      case 2: // Busy
        return "secondary";
      case 3: // OnLeave
        return "destructive";
      case 4: // Inactive
        return "outline";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{t("availability.title")}</h3>
          <p className="text-muted-foreground text-sm">
            {t("availability.description")}
          </p>
        </div>
        <Button
          onClick={() => setIsAdding(true)}
          disabled={isPending || isAdding}
          size="sm"
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("availability.actions.add")}
        </Button>
      </div>

      <div dir={locale.toLowerCase().startsWith("fa") ? "rtl" : "ltr"} className="rounded-2xl border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
        <div className="font-semibold text-foreground">{locale.toLowerCase().startsWith("fa") ? "راهنمای زمان‌های قابل رزرو" : "Booking time guide"}</div>
        <p className="mt-1">
          {locale.toLowerCase().startsWith("fa")
            ? "برای برنامه ثابت، روز هفته را انتخاب کنید و تکرار هفتگی را روشن بگذارید. برای یک تاریخ خاص یا استثنا، تکرار هفتگی را خاموش کنید و تاریخ را وارد کنید."
            : "For a fixed weekly schedule, choose a weekday and keep recurring enabled. For a one-off date or exception, disable recurring and choose the date."}
        </p>
        <p className="mt-2 text-xs">
          {locale.toLowerCase().startsWith("fa")
            ? "ساعت پایان باید بعد از ساعت شروع باشد. وضعیت قابل رزرو یعنی مشتری می‌تواند در این بازه نوبت بگیرد."
            : "End time must be after start time. Available status means customers can book during this window."}
        </p>
      </div>

      {/* Existing availabilities */}
      <div className="grid gap-3">
        {staff.availabilities.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-muted-foreground text-center">
                <Calendar className="mx-auto mb-2 h-8 w-8" />
                <p>{t("availability.noAvailabilities")}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          staff.availabilities.map((availability) => (
            <Card key={availability.id}>
              <CardContent className="pt-4">
                {editingId === availability.id ? (
                  // Edit mode
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`edit-dayOfWeek-${availability.id}`}>
                          {t("availability.form.dayOfWeek")}
                        </Label>
                        <Select
                          value={editFormData.dayOfWeek}
                          onValueChange={(value: DayOfWeek) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              dayOfWeek: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DAY_OF_WEEK_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`edit-status-${availability.id}`}>
                          {t("availability.form.status")}
                        </Label>
                        <Select
                          value={editFormData.availabilityStatusId.toString()}
                          onValueChange={(value) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              availabilityStatusId: parseInt(value),
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {AVAILABILITY_STATUS_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.id}
                                value={option.id.toString()}
                              >
                                {option.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                      <TimePicker
                        id={`edit-startTime-${availability.id}`}
                        type="start"
                        label={t("availability.form.startTime")}
                        value={editFormData.startTime}
                        onChange={handleEditStartTimeChange}
                        referenceTime={editFormData.endTime}
                        placeholder={t("availability.form.selectStartTime")}
                        minTime="06:00:00"
                        maxTime="23:00:00"
                      />

                      <TimePicker
                        id={`edit-endTime-${availability.id}`}
                        type="end"
                        label={t("availability.form.endTime")}
                        value={editFormData.endTime}
                        onChange={(time) =>
                          setEditFormData((prev) => ({
                            ...prev,
                            endTime: time,
                          }))
                        }
                        referenceTime={editFormData.startTime}
                        placeholder={t("availability.form.selectEndTime")}
                        minTime="06:15:00"
                        maxTime="23:45:00"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`edit-isRecurring-${availability.id}`}
                        checked={editFormData.isRecurring}
                        onCheckedChange={(checked) =>
                          setEditFormData((prev) => ({
                            ...prev,
                            isRecurring: checked,
                            specificDate: checked ? "" : prev.specificDate,
                          }))
                        }
                      />
                      <Label htmlFor={`edit-isRecurring-${availability.id}`}>
                        {t("availability.form.isRecurring")}
                      </Label>
                    </div>

                    {!editFormData.isRecurring && (
                      <div className="space-y-2">
                        <Label htmlFor={`edit-specificDate-${availability.id}`}>
                          {t("availability.form.specificDate")}
                        </Label>
                        <DatePicker
                          value={editFormData.specificDate}
                          onChange={(value) =>
                            setEditFormData((prev) => ({
                              ...prev,
                              specificDate: value,
                            }))
                          }
                          placeholder={t("availability.form.specificDate")}
                          disabled={isPending}
                          disablePast={true}
                        />
                      </div>
                    )}

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={isPending}
                      >
                        {t("actions.cancel")}
                      </Button>
                      <Button
                        onClick={() =>
                          handleUpdateAvailability(availability.id)
                        }
                        disabled={isPending}
                      >
                        {t("actions.save")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display mode
                  <div className="space-y-3 sm:flex sm:items-start sm:justify-between sm:space-y-0">
                    {/* Content section - stacks vertically on mobile, flexes on larger screens */}
                    <div className="min-w-0 flex-1 space-y-3 sm:space-y-2">
                      {/* Day and Time info - stack on mobile, inline on tablet+ */}
                      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                          <span className="text-sm font-medium sm:text-base">
                            {getLocalizedDayName(availability.dayOfWeek)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                          <span className="text-foreground text-sm">
                            {formatTime(availability.startTime)} -{" "}
                            {formatTime(availability.endTime)}
                          </span>
                        </div>
                      </div>

                      {/* Badges - stack on mobile, inline on larger screens */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={getStatusBadgeVariant(
                            availability.availabilityStatusId
                          )}
                          className="text-xs"
                        >
                          {getLocalizedStatusName(
                            availability.availabilityStatusId
                          )}
                        </Badge>
                        <Badge
                          variant={
                            availability.isRecurring ? "outline" : "secondary"
                          }
                          className="text-xs"
                        >
                          {availability.isRecurring
                            ? t("availability.recurring")
                            : t("availability.specific")}
                        </Badge>
                      </div>

                      {/* Specific date if present */}
                      {availability.specificDate && (
                        <p className="text-muted-foreground text-xs sm:text-sm">
                          {t("availability.specificDate")}:{" "}
                          {formatDate(availability.specificDate, locale)}
                        </p>
                      )}
                    </div>

                    {/* Action buttons - Edit and Delete */}
                    <div className="flex flex-shrink-0 items-center gap-1 self-start">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(availability)}
                        disabled={isPending}
                        className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(availability)}
                        disabled={isPending}
                        className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                      >
                        <Trash2 className="text-destructive h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add availability form */}
      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t("availability.add.title")}
            </CardTitle>
            <CardDescription>
              {t("availability.add.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dayOfWeek">
                    {t("availability.form.dayOfWeek")}
                  </Label>
                  <Select
                    value={newAvailability.dayOfWeek}
                    onValueChange={(value: DayOfWeek) =>
                      setNewAvailability((prev) => ({
                        ...prev,
                        dayOfWeek: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAY_OF_WEEK_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">
                    {t("availability.form.status")}
                  </Label>
                  <Select
                    value={newAvailability.availabilityStatusId.toString()}
                    onValueChange={(value) =>
                      setNewAvailability((prev) => ({
                        ...prev,
                        availabilityStatusId: parseInt(value),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABILITY_STATUS_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.id}
                          value={option.id.toString()}
                        >
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <TimePicker
                  id="startTime"
                  type="start"
                  label={t("availability.form.startTime")}
                  value={newAvailability.startTime}
                  onChange={handleStartTimeChange}
                  referenceTime={newAvailability.endTime}
                  placeholder={t("availability.form.selectStartTime")}
                  minTime="06:00:00"
                  maxTime="23:00:00"
                />

                <TimePicker
                  id="endTime"
                  type="end"
                  label={t("availability.form.endTime")}
                  value={newAvailability.endTime}
                  onChange={(time) =>
                    setNewAvailability((prev) => ({
                      ...prev,
                      endTime: time,
                    }))
                  }
                  referenceTime={newAvailability.startTime}
                  placeholder={t("availability.form.selectEndTime")}
                  minTime="06:15:00"
                  maxTime="23:45:00"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isRecurring"
                checked={newAvailability.isRecurring}
                onCheckedChange={(checked) =>
                  setNewAvailability((prev) => ({
                    ...prev,
                    isRecurring: checked,
                    specificDate: checked ? "" : prev.specificDate,
                  }))
                }
              />
              <Label htmlFor="isRecurring">
                {t("availability.form.isRecurring")}
              </Label>
            </div>

            {!newAvailability.isRecurring && (
              <div className="space-y-2">
                <Label htmlFor="specificDate">
                  {t("availability.form.specificDate")}
                </Label>
                <DatePicker
                  value={newAvailability.specificDate}
                  onChange={(value) =>
                    setNewAvailability((prev) => ({
                      ...prev,
                      specificDate: value,
                    }))
                  }
                  placeholder={t("availability.form.specificDate")}
                  disabled={isPending}
                  disablePast={true}
                />
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsAdding(false)}
                disabled={isPending}
              >
                {t("actions.cancel")}
              </Button>
              <Button onClick={handleAdd} disabled={isPending}>
                {t("availability.actions.add")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog />
    </div>
  );
}
