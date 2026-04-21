
export async function getMediaByUrls(fileUrls: string[]): Promise<MediaItem[]> {
  if (!fileUrls.length) return [];

  const response = await fetch("/api/media/by-urls", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fileUrls }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch media by urls.");
  }

  return response.json();
}