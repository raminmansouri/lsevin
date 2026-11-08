import "server-only";

export type GeoPoint = { lat: number; lng: number; label: string };

/** Places already looked up (also the misses), so repeated questions don't call the API again. */
const cache = new Map<string, GeoPoint | null>();

async function fromNeshan(address: string, key: string): Promise<GeoPoint | null> {
  const res = await fetch(`https://api.neshan.org/v4/geocoding?address=${encodeURIComponent(address)}`, {
    headers: { "Api-Key": key },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    location?: { x?: number; y?: number };
    items?: Array<{ title?: string; location?: { x?: number; y?: number } }>;
  };
  const location = data.location ?? data.items?.[0]?.location;
  if (location?.x == null || location?.y == null) return null;
  return { lat: Number(location.y), lng: Number(location.x), label: data.items?.[0]?.title ?? address };
}

async function fromOpenStreetMap(address: string): Promise<GeoPoint | null> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=fa,en&q=${encodeURIComponent(address)}`,
    {
      // OpenStreetMap's usage policy asks for an identifying User-Agent.
      headers: { "User-Agent": "LSevin-Assistant/1.0 (info@lsevin.com)" },
      signal: AbortSignal.timeout(5000),
    }
  );
  if (!res.ok) return null;
  const [hit] = (await res.json()) as Array<{ lat: string; lon: string; display_name?: string }>;
  if (!hit) return null;
  return { lat: Number(hit.lat), lng: Number(hit.lon), label: hit.display_name ?? address };
}

/**
 * A neighbourhood, street or landmark as coordinates: Neshan when NESHAN_SERVICE_KEY is set
 * (best for Iranian addresses), otherwise OpenStreetMap. Null when the place can't be found.
 */
export async function geocodePlace(place: string, city?: string | null): Promise<GeoPoint | null> {
  const address = [place.trim(), city?.trim()].filter(Boolean).join("، ");
  if (!address) return null;
  const key = address.toLowerCase();
  if (cache.has(key)) return cache.get(key) ?? null;

  let point: GeoPoint | null = null;
  try {
    const neshanKey = process.env.NESHAN_SERVICE_KEY?.trim();
    if (neshanKey) point = await fromNeshan(address, neshanKey);
    if (!point) point = await fromOpenStreetMap(address);
  } catch (error) {
    console.error("[assistant] geocoding failed", error);
  }
  if (cache.size > 2000) cache.clear();
  cache.set(key, point);
  return point;
}