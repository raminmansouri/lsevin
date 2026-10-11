export const PROFILE_KEY: string;
export const PROFILE_TTL: number;
export type OfflineProfile = { name: string; email: string; savedAt: number };
export type SealedProfile = {
  owner: string;
  salt: string;
  iv: string;
  ciphertext: string;
  savedAt: number;
};
export function sealProfile(
  profile: { name: string; email: string },
  passphrase: string,
  owner: string
): Promise<SealedProfile>;
export function openProfile(
  record: SealedProfile,
  passphrase: string
): Promise<OfflineProfile>;
export function clearOfflineProfile(): void;
