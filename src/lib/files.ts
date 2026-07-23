/** Small helpers for reading user-picked files in the Phase 1 mock. */

/**
 * Read an image file as a base64 data URL so it survives page reloads inside
 * Local Storage (unlike `URL.createObjectURL` blobs).
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Probe an audio URL for its duration in seconds (0 when unreadable). */
export function readAudioDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    const probe = new Audio();
    probe.preload = 'metadata';
    probe.onloadedmetadata = () => resolve(Math.round(probe.duration) || 0);
    probe.onerror = () => resolve(0);
    probe.src = url;
  });
}
