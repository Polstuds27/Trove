/**
 * Device app lock.
 *
 * The PIN never leaves the device: only a SHA-256 digest is stored alongside
 * the other local preferences, and unlocking lasts for the browser session.
 * This is a convenience lock for a shared phone or laptop — the server session
 * and the account password remain the real security boundary.
 */
const UNLOCK_KEY = "trove.appUnlocked";

export async function hashPin(pin: string): Promise<string> {
  const value = new TextEncoder().encode(`trove:${pin}`);
  if (globalThis.crypto?.subtle) {
    const digest = await crypto.subtle.digest("SHA-256", value);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  // Non-secure context fallback (e.g. an older browser on plain HTTP). The PIN
  // is still not stored in the clear; this is only a weaker digest.
  let hash = 5381;
  for (const byte of value) hash = ((hash << 5) + hash) ^ byte;
  return `fallback-${(hash >>> 0).toString(16)}`;
}

export async function verifyPin(pin: string, expected: string | null): Promise<boolean> {
  if (!expected) return false;
  return (await hashPin(pin)) === expected;
}

export function markUnlocked(): void {
  try {
    sessionStorage.setItem(UNLOCK_KEY, "1");
  } catch {
    // Private mode may refuse storage; the lock simply re-arms on reload.
  }
}

export function clearUnlocked(): void {
  try {
    sessionStorage.removeItem(UNLOCK_KEY);
  } catch {
    // Nothing to clear.
  }
}

export function isUnlocked(): boolean {
  try {
    return sessionStorage.getItem(UNLOCK_KEY) === "1";
  } catch {
    return false;
  }
}

export function isValidPin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}
