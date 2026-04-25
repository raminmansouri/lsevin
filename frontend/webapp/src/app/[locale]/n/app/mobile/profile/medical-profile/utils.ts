import type {
  MedicalProfileAllergy,
  MedicalProfileCondition,
  MedicalProfileDocument,
  MedicalProfileMedication,
} from "./types";

export function formatFileSize(sizeBytes: number | null | undefined): string {
  if (!sizeBytes || sizeBytes <= 0) {
    return "—";
  }

  const units = ["B", "KB", "MB", "GB"];
  let value = sizeBytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  if (unitIndex === 0) {
    return `${Math.round(value)} ${units[unitIndex]}`;
  }

  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

export function formatDisplayDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString().slice(0, 10);
}

export function allergyLabel(item: MedicalProfileAllergy): string {
  return item.severity !== "moderate" ? `${item.name} (${item.severity})` : item.name;
}

export function medicationLabel(item: MedicalProfileMedication): string {
  return `${item.name} ${item.dosage} (${item.frequency})`;
}

export function conditionLabel(item: MedicalProfileCondition): string {
  return item.name;
}

export function documentViewUrl(doc: MedicalProfileDocument): string {
  return doc.fileUrl;
}
