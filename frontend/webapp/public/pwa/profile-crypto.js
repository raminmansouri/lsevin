export const PROFILE_KEY = "lsevin-pwa-profile-v1";
export const PROFILE_TTL = 24 * 60 * 60 * 1000;
const encode = (bytes) => btoa(String.fromCharCode(...bytes));
const decode = (value) =>
  Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
async function deriveKey(passphrase, salt) {
  if (passphrase.length < 10 || passphrase.length > 128)
    throw new Error("Use a passphrase of 10–128 characters.");
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 210000, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}
export async function sealProfile(profile, passphrase, owner) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const savedAt = Date.now();
  // Explicit field projection: never persist profile IDs, tokens, medical
  // records, uploads, wallet balance or the raw server response.
  const payload = {
    name: String(profile.name || "").slice(0, 200),
    email: String(profile.email || "").slice(0, 320),
    savedAt,
  };
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: new TextEncoder().encode(owner) },
    key,
    new TextEncoder().encode(JSON.stringify(payload))
  );
  return {
    owner,
    salt: encode(salt),
    iv: encode(iv),
    ciphertext: encode(new Uint8Array(ciphertext)),
    savedAt,
  };
}
export async function openProfile(record, passphrase) {
  if (Date.now() - record.savedAt > PROFILE_TTL)
    throw new Error("Saved profile has expired. Reconnect to save it again.");
  const key = await deriveKey(passphrase, decode(record.salt));
  const plaintext = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: decode(record.iv),
      additionalData: new TextEncoder().encode(record.owner),
    },
    key,
    decode(record.ciphertext)
  );
  const payload = JSON.parse(new TextDecoder().decode(plaintext));
  if (payload.savedAt !== record.savedAt)
    throw new Error("Invalid saved profile.");
  return payload;
}
export function clearOfflineProfile() {
  void globalThis.LsevinViewStore?.clear().catch(() => {});
  try {
    localStorage.removeItem(PROFILE_KEY);
  } catch {
    /* Storage may be disabled. */
  }
  window.dispatchEvent(new Event("lsevin-profile-cleared"));
}
