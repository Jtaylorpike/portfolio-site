// Adaptive quality policy for the virtual gallery.
//
// Phase 8AO keeps all observations local to the browser. No performance,
// hardware, network, or preference data is transmitted. Automatic mode uses
// conservative device/network hints, the last locally observed gallery tier,
// asset-cache readiness, and sustained in-gallery frame timing.

export type GalleryQualityMode = 'auto' | 'low' | 'balanced' | 'high';
export type GalleryQualityTier = Exclude<GalleryQualityMode, 'auto'>;
export type GalleryArtworkTexturePolicy = 'focus' | 'stream' | 'preload';

export type GalleryQualitySettings = {
  pixelRatioCap: number;
  artworkTexturePolicy: GalleryArtworkTexturePolicy;
  initialPreviewTextureCount: number;
  textureLoadBatchSize: number;
  fullTextureLoadDelay: number | null;
};

export type GalleryQualityState = {
  mode: GalleryQualityMode;
  tier: GalleryQualityTier;
  autoCeiling: GalleryQualityTier;
  cacheTier: GalleryQualityTier;
};

type QualityStateListener = (state: GalleryQualityState) => void;

type NavigatorWithDeviceHints = Navigator & {
  deviceMemory?: number;
  connection?: {
    saveData?: boolean;
    effectiveType?: string;
  };
};

const qualityModeStorageKey = 'tp-gallery-quality-mode-v1';
const observedTierStorageKey = 'tp-gallery-observed-tier-v1';
const tierOrder: GalleryQualityTier[] = ['low', 'balanced', 'high'];
const listeners = new Set<QualityStateListener>();

const qualitySettings: Record<GalleryQualityTier, GalleryQualitySettings> = {
  low: {
    pixelRatioCap: 0.95,
    artworkTexturePolicy: 'focus',
    initialPreviewTextureCount: 3,
    textureLoadBatchSize: 1,
    fullTextureLoadDelay: null
  },
  balanced: {
    pixelRatioCap: 1.22,
    artworkTexturePolicy: 'stream',
    initialPreviewTextureCount: 5,
    textureLoadBatchSize: 1,
    fullTextureLoadDelay: 1100
  },
  high: {
    pixelRatioCap: 1.5,
    artworkTexturePolicy: 'preload',
    initialPreviewTextureCount: 8,
    textureLoadBatchSize: 1,
    fullTextureLoadDelay: 320
  }
};

function isQualityMode(value: string | null): value is GalleryQualityMode {
  return value === 'auto' || value === 'low' || value === 'balanced' || value === 'high';
}

function isQualityTier(value: string | null): value is GalleryQualityTier {
  return value === 'low' || value === 'balanced' || value === 'high';
}

function getTierRank(tier: GalleryQualityTier) {
  return tierOrder.indexOf(tier);
}

function clampTierToCeiling(tier: GalleryQualityTier, ceiling: GalleryQualityTier) {
  return tierOrder[Math.min(getTierRank(tier), getTierRank(ceiling))];
}

function readStorage(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private browsing and storage policies may make localStorage unavailable.
  }
}

function getAutomaticQualityCeiling(): GalleryQualityTier {
  const navigatorWithHints = navigator as NavigatorWithDeviceHints;
  const connection = navigatorWithHints.connection;
  const memory = navigatorWithHints.deviceMemory;
  const cores = navigator.hardwareConcurrency;
  const devicePixelRatio = window.devicePixelRatio || 1;
  const viewportPixels = Math.max(1, window.innerWidth * window.innerHeight * devicePixelRatio ** 2);

  if (
    connection?.saveData ||
    connection?.effectiveType === 'slow-2g' ||
    connection?.effectiveType === '2g' ||
    (typeof memory === 'number' && memory <= 4) ||
    (typeof cores === 'number' && cores <= 4)
  ) {
    return 'low';
  }

  if (
    (typeof memory !== 'number' || memory >= 8) &&
    (typeof cores !== 'number' || cores >= 8) &&
    devicePixelRatio <= 2.25 &&
    viewportPixels <= 6_500_000
  ) {
    return 'high';
  }

  return 'balanced';
}

function getInitialAutomaticTier(autoCeiling: GalleryQualityTier) {
  const storedTier = readStorage(observedTierStorageKey);

  if (isQualityTier(storedTier)) {
    return clampTierToCeiling(storedTier, autoCeiling);
  }

  // First-time high-capability visitors begin at balanced. Automatic mode can
  // promote to high after the full gallery asset set is cached and the actual
  // gallery frame timings remain stable.
  return autoCeiling === 'high' ? 'balanced' : autoCeiling;
}

const autoCeiling = getAutomaticQualityCeiling();
const storedMode = readStorage(qualityModeStorageKey);
const initialMode: GalleryQualityMode = isQualityMode(storedMode) ? storedMode : 'auto';
const initialTier = initialMode === 'auto'
  ? getInitialAutomaticTier(autoCeiling)
  : initialMode;

let state: GalleryQualityState = {
  mode: initialMode,
  tier: initialTier,
  autoCeiling,
  cacheTier: 'low'
};

let lastFrameTimestamp = 0;
let warmupFramesRemaining = 45;
let sampleWindow: number[] = [];
let stableUpgradeWindows = 0;
let cooldownFramesRemaining = 0;

function notifyListeners() {
  const snapshot = { ...state };
  listeners.forEach((listener) => listener(snapshot));
}

function setTier(tier: GalleryQualityTier, persistObservedTier: boolean) {
  if (state.tier === tier) {
    return;
  }

  state = { ...state, tier };
  cooldownFramesRemaining = 180;
  stableUpgradeWindows = 0;
  sampleWindow = [];

  if (persistObservedTier) {
    writeStorage(observedTierStorageKey, tier);
  }

  notifyListeners();
}

function getPercentile(values: number[], percentile: number) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor(sorted.length * percentile)));
  return sorted[index] ?? 0;
}

function getNextHigherTier(tier: GalleryQualityTier) {
  const rank = getTierRank(tier);
  return tierOrder[Math.min(tierOrder.length - 1, rank + 1)];
}

function getNextLowerTier(tier: GalleryQualityTier) {
  const rank = getTierRank(tier);
  return tierOrder[Math.max(0, rank - 1)];
}

function evaluateFrameWindow() {
  if (state.mode !== 'auto' || sampleWindow.length < 120) {
    return;
  }

  const average = sampleWindow.reduce((total, value) => total + value, 0) / sampleWindow.length;
  const p90 = getPercentile(sampleWindow, 0.9);
  sampleWindow = [];

  if (average > 23 || p90 > 31) {
    const lowerTier = getNextLowerTier(state.tier);
    if (lowerTier !== state.tier) {
      setTier(lowerTier, true);
    }
    return;
  }

  const higherTier = getNextHigherTier(state.tier);
  const canPromote =
    higherTier !== state.tier &&
    getTierRank(higherTier) <= getTierRank(state.autoCeiling) &&
    getTierRank(higherTier) <= getTierRank(state.cacheTier);

  if (canPromote && average < 17.2 && p90 < 20.5) {
    stableUpgradeWindows += 1;

    if (stableUpgradeWindows >= 3) {
      setTier(higherTier, true);
    }
    return;
  }

  stableUpgradeWindows = 0;
}

export function getGalleryQualityState(): GalleryQualityState {
  return { ...state };
}

export function getGalleryQualitySettings(tier = state.tier): GalleryQualitySettings {
  return qualitySettings[tier];
}

export function getGalleryAutomaticQualityCeiling() {
  return state.autoCeiling;
}

export function setGalleryQualityMode(mode: GalleryQualityMode) {
  if (state.mode === mode) {
    return;
  }

  writeStorage(qualityModeStorageKey, mode);

  const tier = mode === 'auto'
    ? getInitialAutomaticTier(state.autoCeiling)
    : mode;

  state = { ...state, mode, tier };
  resetGalleryPerformanceSampling();
  notifyListeners();
}

export function cycleGalleryQualityMode() {
  const modes: GalleryQualityMode[] = ['auto', 'low', 'balanced', 'high'];
  const currentIndex = modes.indexOf(state.mode);
  const nextMode = modes[(currentIndex + 1) % modes.length];
  setGalleryQualityMode(nextMode);
  return getGalleryQualityState();
}

export function subscribeToGalleryQuality(listener: QualityStateListener) {
  listeners.add(listener);
  listener(getGalleryQualityState());

  return () => {
    listeners.delete(listener);
  };
}

export function markGalleryCacheTierReady(tier: GalleryQualityTier) {
  if (getTierRank(tier) <= getTierRank(state.cacheTier)) {
    return;
  }

  state = { ...state, cacheTier: tier };
  notifyListeners();
}

export function resetGalleryPerformanceSampling() {
  lastFrameTimestamp = 0;
  warmupFramesRemaining = 45;
  sampleWindow = [];
  stableUpgradeWindows = 0;
  cooldownFramesRemaining = 0;
}

export function recordGalleryFrame(timestamp: number) {
  if (document.hidden) {
    lastFrameTimestamp = timestamp;
    return;
  }

  if (!lastFrameTimestamp) {
    lastFrameTimestamp = timestamp;
    return;
  }

  const frameTime = timestamp - lastFrameTimestamp;
  lastFrameTimestamp = timestamp;

  if (frameTime < 5 || frameTime > 100) {
    return;
  }

  if (warmupFramesRemaining > 0) {
    warmupFramesRemaining -= 1;
    return;
  }

  if (cooldownFramesRemaining > 0) {
    cooldownFramesRemaining -= 1;
    return;
  }

  sampleWindow.push(frameTime);

  if (sampleWindow.length >= 120) {
    evaluateFrameWindow();
  }
}

export function getGalleryQualityModeLabel(mode: GalleryQualityMode) {
  switch (mode) {
    case 'auto':
      return 'Auto';
    case 'low':
      return 'Low';
    case 'balanced':
      return 'Medium';
    case 'high':
      return 'High';
  }
}

export function getGalleryQualityTierLabel(tier: GalleryQualityTier) {
  switch (tier) {
    case 'low':
      return 'Low';
    case 'balanced':
      return 'Medium';
    case 'high':
      return 'High';
  }
}
