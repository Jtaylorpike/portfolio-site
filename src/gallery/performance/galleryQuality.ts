// Adaptive quality policy for the virtual gallery.
//
// Phase 8AO keeps all observations local to the browser. No performance,
// hardware, network, or preference data is transmitted. Automatic mode uses
// conservative device/network hints, the last locally observed gallery tier,
// asset-cache readiness, and sustained in-gallery frame timing.

export type GalleryQualityMode = 'auto' | 'low' | 'balanced' | 'high';
export type GalleryQualityTier = 'low' | 'balanced' | 'high';
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
  gpuTier: GalleryQualityTier;
};

export type GalleryPerformanceDiagnostics = {
  sampleCount: number;
  averageIntervalMs: number;
  p90IntervalMs: number;
  averageWorkMs: number;
  p90WorkMs: number;
  estimatedFps: number;
};

type QualityStateListener = (state: GalleryQualityState) => void;

type GalleryFrameSample = {
  interval: number;
  work: number;
};

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
    pixelRatioCap: 0.95,
    artworkTexturePolicy: 'stream',
    initialPreviewTextureCount: 5,
    textureLoadBatchSize: 1,
    fullTextureLoadDelay: null
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

  if (
    connection?.saveData ||
    connection?.effectiveType === 'slow-2g' ||
    connection?.effectiveType === '2g' ||
    (typeof memory === 'number' && memory <= 4) ||
    (typeof cores === 'number' && cores <= 4)
  ) {
    return 'low';
  }

  // Auto may promote only to the balanced tier. High remains
  // an explicit visitor choice and is never selected automatically.
  return 'balanced';
}

function getAutomaticQualityHardCeiling(): GalleryQualityTier {
  const connection = (navigator as NavigatorWithDeviceHints).connection;

  if (
    connection?.saveData ||
    connection?.effectiveType === 'slow-2g' ||
    connection?.effectiveType === '2g'
  ) {
    return 'low';
  }

  if (connection?.effectiveType === '3g') {
    return 'balanced';
  }

  return 'high';
}

function getInitialAutomaticCeiling(
  hintedCeiling: GalleryQualityTier,
  hardCeiling: GalleryQualityTier
) {
  const storedTier = readStorage(observedTierStorageKey);
  const evidenceTier = isQualityTier(storedTier)
    ? tierOrder[Math.max(getTierRank(hintedCeiling), getTierRank(storedTier))]
    : hintedCeiling;

  return clampTierToCeiling(clampTierToCeiling(evidenceTier, hardCeiling), 'balanced');
}

function getInitialAutomaticTier(): GalleryQualityTier {
  // Auto always starts at the least expensive tier. Sustained runtime
  // evidence may quietly promote it after the gallery is fully prepared.
  return 'low';
}

const hintedAutoCeiling = getAutomaticQualityCeiling();
const hardAutoCeiling = getAutomaticQualityHardCeiling();
const autoCeiling = getInitialAutomaticCeiling(hintedAutoCeiling, hardAutoCeiling);
const storedMode = readStorage(qualityModeStorageKey);
const initialMode: GalleryQualityMode = isQualityMode(storedMode) ? storedMode : 'auto';
const initialTier = initialMode === 'auto' ? getInitialAutomaticTier() : initialMode;

let state: GalleryQualityState = {
  mode: initialMode,
  tier: initialTier,
  autoCeiling,
  cacheTier: 'low',
  gpuTier: 'low'
};

let lastFrameTimestamp = 0;
let warmupFramesRemaining = 30;
let sampleWindow: GalleryFrameSample[] = [];
let diagnosticWindow: GalleryFrameSample[] = [];
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

function getNextLowerTier(tier: GalleryQualityTier) {
  const rank = getTierRank(tier);
  return tierOrder[Math.max(0, rank - 1)];
}

function evaluateFrameWindow() {
  if (state.mode !== 'auto' || sampleWindow.length < 90) {
    return;
  }

  const intervals = sampleWindow.map((sample) => sample.interval);
  const workTimes = sampleWindow.map((sample) => sample.work);
  const average = intervals.reduce((total, value) => total + value, 0) / intervals.length;
  const p90 = getPercentile(intervals, 0.9);
  const averageWork = workTimes.reduce((total, value) => total + value, 0) / workTimes.length;
  const p90Work = getPercentile(workTimes, 0.9);
  sampleWindow = [];

  if (average > 23 || p90 > 31 || averageWork > 12 || p90Work > 18) {
    const lowerTier = getNextLowerTier(state.tier);
    if (lowerTier !== state.tier) {
      // A tier that has already exceeded the sustained-performance budget is
      // not retried during this page session. Without this lock, the lighter
      // tier immediately produces stable samples, promotes back up, and the
      // gallery oscillates indefinitely between the same two tiers.
      state = { ...state, autoCeiling: lowerTier };
      setTier(lowerTier, true);
    }
    return;
  }

  const balancedReady = getTierRank(state.cacheTier) >= getTierRank('balanced') &&
    getTierRank(state.gpuTier) >= getTierRank('balanced');

  if (
    state.tier === 'low' &&
    getTierRank(state.autoCeiling) >= getTierRank('balanced') &&
    balancedReady &&
    average <= 18.5 &&
    p90 <= 22 &&
    averageWork <= 8 &&
    p90Work <= 12
  ) {
    setTier('balanced', true);
  }
}

export function getGalleryQualityState(): GalleryQualityState {
  return { ...state };
}

export function getGalleryQualitySettings(tier = state.tier): GalleryQualitySettings {
  return qualitySettings[tier];
}

export function getGalleryPerformanceDiagnostics(): GalleryPerformanceDiagnostics {
  const intervals = diagnosticWindow.map((sample) => sample.interval);
  const workTimes = diagnosticWindow.map((sample) => sample.work);
  const averageIntervalMs = intervals.length
    ? intervals.reduce((total, value) => total + value, 0) / intervals.length
    : 0;
  const averageWorkMs = workTimes.length
    ? workTimes.reduce((total, value) => total + value, 0) / workTimes.length
    : 0;

  return {
    sampleCount: diagnosticWindow.length,
    averageIntervalMs,
    p90IntervalMs: getPercentile(intervals, 0.9),
    averageWorkMs,
    p90WorkMs: getPercentile(workTimes, 0.9),
    estimatedFps: averageIntervalMs > 0 ? 1000 / averageIntervalMs : 0
  };
}

export function getGalleryAutomaticQualityCeiling() {
  return state.autoCeiling;
}

export function setGalleryQualityMode(mode: GalleryQualityMode) {
  if (state.mode === mode) {
    return;
  }

  writeStorage(qualityModeStorageKey, mode);

  const tier = mode === 'auto' ? getInitialAutomaticTier() : mode;

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

export function markGalleryGpuTierReady(tier: GalleryQualityTier) {
  if (getTierRank(tier) <= getTierRank(state.gpuTier)) {
    return;
  }

  state = { ...state, gpuTier: tier };
  notifyListeners();
}

export function resetGalleryGpuTier() {
  if (state.gpuTier === 'low') {
    return;
  }

  state = { ...state, gpuTier: 'low' };
}

export function resetGalleryPerformanceSampling() {
  lastFrameTimestamp = 0;
  warmupFramesRemaining = 30;
  sampleWindow = [];
  diagnosticWindow = [];
  cooldownFramesRemaining = 0;
}

export function recordGalleryFrame(timestamp: number, workDuration = 0) {
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

  const sample = {
    interval: frameTime,
    work: Math.max(0, workDuration)
  };

  sampleWindow.push(sample);
  diagnosticWindow.push(sample);
  if (diagnosticWindow.length > 120) {
    diagnosticWindow.shift();
  }

  if (sampleWindow.length >= 90) {
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
