export type GalleryEnvironmentTimeState = 'dawn' | 'day' | 'dusk' | 'night';
export type GalleryEnvironmentTimeMode = 'auto' | GalleryEnvironmentTimeState;

export type GalleryEnvironmentTimeSnapshot = {
  mode: GalleryEnvironmentTimeMode;
  state: GalleryEnvironmentTimeState;
  localHour: number;
};

const STORAGE_KEY = 'tp-gallery-environment-time-v1';
const listeners = new Set<(snapshot: GalleryEnvironmentTimeSnapshot) => void>();

function isGalleryEnvironmentTimeMode(
  value: string | null
): value is GalleryEnvironmentTimeMode {
  return value === 'auto' || value === 'dawn' || value === 'day' || value === 'dusk' || value === 'night';
}

function readStoredMode(): GalleryEnvironmentTimeMode {
  try {
    const storedMode = window.localStorage.getItem(STORAGE_KEY);
    return isGalleryEnvironmentTimeMode(storedMode) ? storedMode : 'auto';
  } catch {
    return 'auto';
  }
}

function writeStoredMode(mode: GalleryEnvironmentTimeMode) {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Storage can be unavailable in private browsing or under strict policies.
  }
}

export function resolveGalleryEnvironmentTimeState(
  localHour: number
): GalleryEnvironmentTimeState {
  const normalizedHour = Number.isFinite(localHour)
    ? ((Math.floor(localHour) % 24) + 24) % 24
    : 12;

  if (normalizedHour >= 5 && normalizedHour < 8) {
    return 'dawn';
  }

  if (normalizedHour >= 8 && normalizedHour < 17) {
    return 'day';
  }

  if (normalizedHour >= 17 && normalizedHour < 20) {
    return 'dusk';
  }

  return 'night';
}

let mode = readStoredMode();

export function getGalleryEnvironmentTimeSnapshot(
  date = new Date()
): GalleryEnvironmentTimeSnapshot {
  const localHour = Number.isFinite(date.getHours()) ? date.getHours() : 12;

  return {
    mode,
    state: mode === 'auto' ? resolveGalleryEnvironmentTimeState(localHour) : mode,
    localHour
  };
}

export function getGalleryEnvironmentTimeStateLabel(
  state: GalleryEnvironmentTimeState
) {
  return state.charAt(0).toUpperCase() + state.slice(1);
}

export function setGalleryEnvironmentTimeMode(
  nextMode: GalleryEnvironmentTimeMode
) {
  if (!isGalleryEnvironmentTimeMode(nextMode) || nextMode === mode) {
    return;
  }

  mode = nextMode;
  writeStoredMode(mode);
  const snapshot = getGalleryEnvironmentTimeSnapshot();
  listeners.forEach((listener) => listener(snapshot));
}

export function subscribeToGalleryEnvironmentTime(
  listener: (snapshot: GalleryEnvironmentTimeSnapshot) => void
) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
