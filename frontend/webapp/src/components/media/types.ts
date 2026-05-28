export const DEFAULT_MEDIA_LOCALES = ["en", "fa", "ar", "tr"] as const;

export type MediaLocale = (typeof DEFAULT_MEDIA_LOCALES)[number];
export type MediaType = "image" | "video" | "file";
export type MediaSort = "newest" | "oldest" | "title" | "filename";
export type MediaViewMode = "grid" | "list";
export type LocalizedText = Record<string, string>;

export type MediaItem = {
  id: string;
  titleTranslations: LocalizedText;
  descriptionTranslations: LocalizedText;
  altTranslations: LocalizedText;
  originalName: string;
  storedName: string;
  fileUrl: string;
  storagePath: string | null;
  storageKey: string | null;
  mimeType: string;
  extension: string | null;
  mediaType: MediaType;
  fileSize: number;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  createdBy: string | null;
  isPublic: boolean;
  createDate: string;
  lastModifiedDate: string;
};

export type MediaListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  mediaType?: MediaType | "all";
  mimeType?: string;
  sort?: MediaSort;
  locale?: string;
};

export type MediaListResponse = {
  items: MediaItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type CreateMediaInput = {
  titleTranslations?: LocalizedText;
  descriptionTranslations?: LocalizedText;
  altTranslations?: LocalizedText;
  originalName: string;
  storedName: string;
  fileUrl: string;
  storagePath?: string | null;
  storageKey?: string | null;
  mimeType: string;
  extension?: string | null;
  mediaType: MediaType;
  fileSize: number;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
  createdBy?: string | null;
  isPublic?: boolean;
};

export type UpdateMediaInput = Partial<
  Omit<CreateMediaInput, "originalName" | "storedName" | "fileUrl" | "mimeType" | "mediaType" | "fileSize">
> & {
  originalName?: string;
  storedName?: string;
  fileUrl?: string;
  mimeType?: string;
  mediaType?: MediaType;
  fileSize?: number;
};

export type MediaPickerValue = Pick<
  MediaItem,
  | "id"
  | "titleTranslations"
  | "descriptionTranslations"
  | "altTranslations"
  | "originalName"
  | "fileUrl"
  | "mimeType"
  | "mediaType"
  | "fileSize"
  | "width"
  | "height"
  | "durationSeconds"
>;

export type GalleryPickerItem = {
  media: MediaPickerValue;
  order: number;
  isPrimary: boolean;
  titleTranslations: LocalizedText;
  descriptionTranslations: LocalizedText;
};

export type MediaManagerLabels = {
  libraryTitle: string;
  chooseMedia: string;
  upload: string;
  uploading: string;
  searchPlaceholder: string;
  allTypes: string;
  images: string;
  videos: string;
  files: string;
  sortNewest: string;
  sortOldest: string;
  sortTitle: string;
  sortFilename: string;
  grid: string;
  list: string;
  noItemsTitle: string;
  noItemsDescription: string;
  selectedCount: (count: number) => string;
  deleteSelected: string;
  editMetadata: string;
  save: string;
  cancel: string;
  remove: string;
  confirmSelection: string;
  close: string;
  title: string;
  description: string;
  altText: string;
  replaceFile: string;
  uploadHint: string;
  dragAndDrop: string;
  pickFiles: string;
  primary: string;
  gallery: string;
  moveUp: string;
  moveDown: string;
  openLibrary: string;
};

export type UploadHandlerInput = {
  file: File;
  titleTranslations: LocalizedText;
  descriptionTranslations: LocalizedText;
  altTranslations: LocalizedText;
  onProgress?: (progress: number | null) => void;
};

export type UploadHandlerResult = {
  fileUrl: string;
  storedName?: string | null;
  storagePath?: string | null;
  storageKey?: string | null;
};

export type UploadMediaHandler = (
  input: UploadHandlerInput
) => Promise<UploadHandlerResult>;

export const defaultMediaLabels: MediaManagerLabels = {
  libraryTitle: "Media Library",
  chooseMedia: "Choose media",
  upload: "Upload",
  uploading: "Uploading",
  searchPlaceholder: "Search by filename, title, or description",
  allTypes: "All",
  images: "Images",
  videos: "Videos",
  files: "Files",
  sortNewest: "Newest",
  sortOldest: "Oldest",
  sortTitle: "Title",
  sortFilename: "Filename",
  grid: "Grid",
  list: "List",
  noItemsTitle: "No media found",
  noItemsDescription: "Try changing your filters or upload a new file.",
  selectedCount: (count) => `${count} selected`,
  deleteSelected: "Delete selected",
  editMetadata: "Edit metadata",
  save: "Save",
  cancel: "Cancel",
  remove: "Remove",
  confirmSelection: "Use selected media",
  close: "Close",
  title: "Title",
  description: "Description",
  altText: "Alt text",
  replaceFile: "Replace file",
  uploadHint: "Images, videos, and generic files are supported.",
  dragAndDrop: "Drag and drop files here",
  pickFiles: "Pick files",
  primary: "Primary",
  gallery: "Gallery",
  moveUp: "Move up",
  moveDown: "Move down",
  openLibrary: "Open library",
};

export function toMediaPickerValue(item: MediaItem): MediaPickerValue {
  return {
    id: item.id,
    titleTranslations: item.titleTranslations,
    descriptionTranslations: item.descriptionTranslations,
    altTranslations: item.altTranslations,
    originalName: item.originalName,
    fileUrl: item.fileUrl,
    mimeType: item.mimeType,
    mediaType: item.mediaType,
    fileSize: item.fileSize,
    width: item.width,
    height: item.height,
    durationSeconds: item.durationSeconds,
  };
}
