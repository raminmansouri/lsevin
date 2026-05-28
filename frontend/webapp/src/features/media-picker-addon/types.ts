export type MediaType = "image" | "video" | "file";

export type LocalizedContent = Record<string, string>;

export interface MediaItem {
  id: string;
  titleTranslations?: LocalizedContent | null;
  descriptionTranslations?: LocalizedContent | null;
  altTranslations?: LocalizedContent | null;
  originalName: string;
  storedName?: string | null;
  fileUrl: string;
  storagePath?: string | null;
  mimeType: string;
  extension?: string | null;
  mediaType: MediaType;
  fileSize: number;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
  createDate?: string | null;
  lastModifiedDate?: string | null;
  isPublic?: boolean | null;
}

export interface MediaListResponse {
  items: MediaItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UploadMediaResult {
  id?: string;
  fileUrl: string;
  originalName: string;
  storedName?: string | null;
  mimeType: string;
  mediaType: MediaType;
  fileSize: number;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
}

export interface UploadWithProgressInput {
  file: File;
  onProgress?: (progress: number) => void;
}

export type UploadWithProgress = (
  input: UploadWithProgressInput
) => Promise<UploadMediaResult>;

export interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  mode: "single" | "multiple";
  mediaType?: MediaType | "all";
  maxSelection?: number;
  selectedIds?: string[];
  onConfirm: (items: MediaItem[]) => void;
  uploadWith?: UploadWithProgress;
  title?: string;
}

export interface BaseMediaPickerInputProps {
  name: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  mediaType?: MediaType | "all";
  uploadWith?: UploadWithProgress;
  className?: string;
  helperText?: string;
  modalTitle?: string;
}
