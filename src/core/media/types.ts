export type CoreMediaItem = {
  id: string;
  originalName: string;
  fileUrl: string;
  mimeType: string;
  mediaType: "image" | "video" | "file";
  fileSize: number;
  titleTranslations: Record<string, string>;
  altTranslations: Record<string, string>;
  createdBy: string | null;
  isPublic: boolean;
  ownedByProvider: boolean;
  sharedByProvider?: boolean;
  createdAt: string;
};
