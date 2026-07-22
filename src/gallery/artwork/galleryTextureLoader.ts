// Three.js gallery texture loader and browser-cache prewarmer.
//
// Phase 8AO separates two jobs:
// 1. browser-cache warming begins after the public site opens without creating
//    GPU textures or blocking the homepage;
// 2. Three.js textures are created according to the active gallery quality
//    tier when the gallery opens, then promoted in controlled idle batches.

import * as THREE from 'three';
import {
  getGalleryQualitySettings,
  markGalleryCacheTierReady,
  type GalleryQualityTier
} from '../performance/galleryQuality';

type TextureSource = {
  image: string;
  previewImage?: string;
};

type TextureUpdateListener = (url: string, texture: THREE.Texture) => void;

type IdleWindow = Window & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
};

const textureLoader = new THREE.TextureLoader();
const textureCache = new Map<string, THREE.Texture>();
const texturePromiseCache = new Map<string, Promise<THREE.Texture | null>>();
const textureUpdateListeners = new Set<TextureUpdateListener>();
const browserWarmCache = new Set<string>();
const browserWarmPromiseCache = new Map<string, Promise<boolean>>();

function isPreviewTextureSource(src: string) {
  return src.includes('/thumb/') || src.includes('thumb') || src.includes('/display/');
}

function configureTexture(texture: THREE.Texture, src: string) {
  const isPreviewTexture = isPreviewTextureSource(src);

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = !isPreviewTexture;
  texture.minFilter = isPreviewTexture ? THREE.LinearFilter : THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
}

function getUniqueSources(sources: Array<string | undefined>) {
  return [...new Set(sources.filter((source): source is string => Boolean(source)))];
}

function waitForNextPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      window.setTimeout(resolve, 0);
    });
  });
}

function waitForGalleryIdle(timeout = 1400) {
  return new Promise<void>((resolve) => {
    const idleWindow = window as IdleWindow;

    if (idleWindow.requestIdleCallback) {
      idleWindow.requestIdleCallback(resolve, { timeout });
      return;
    }

    window.setTimeout(resolve, 160);
  });
}

function scheduleTextureBatchLoad(
  sources: string[],
  batchSize: number,
  delay = 0
) {
  const queue = [...sources];

  if (queue.length === 0) {
    return;
  }

  const loadNextBatch = () => {
    queue.splice(0, batchSize).forEach((source) => {
      void loadGalleryTexture(source);
    });

    if (queue.length > 0) {
      window.setTimeout(() => {
        void waitForGalleryIdle().then(loadNextBatch);
      }, 140);
    }
  };

  window.setTimeout(() => {
    void waitForGalleryIdle().then(loadNextBatch);
  }, delay);
}

async function loadPreviewTexturesInBatches(sources: string[], batchSize: number) {
  for (let index = 0; index < sources.length; index += batchSize) {
    const batch = sources.slice(index, index + batchSize);

    await Promise.all(batch.map((source) => loadGalleryTexture(source)));

    if (index + batchSize < sources.length) {
      await waitForNextPaint();
    }
  }
}

async function warmBrowserSource(source: string) {
  if (browserWarmCache.has(source)) {
    return true;
  }

  const cachedPromise = browserWarmPromiseCache.get(source);
  if (cachedPromise) {
    return cachedPromise;
  }

  const promise = fetch(source, {
    cache: 'force-cache',
    credentials: 'same-origin'
  })
    .then(async (response) => {
      if (!response.ok) {
        return false;
      }

      // Reading the body completes the request so the browser HTTP cache can
      // satisfy the later Three.TextureLoader request without retaining a Blob.
      await response.arrayBuffer();
      browserWarmCache.add(source);
      return true;
    })
    .catch(() => false)
    .finally(() => {
      browserWarmPromiseCache.delete(source);
    });

  browserWarmPromiseCache.set(source, promise);
  return promise;
}

async function warmBrowserSourcesInBatches(
  sources: string[],
  batchSize: number,
  delayBetweenBatches: number
) {
  let successCount = 0;

  for (let index = 0; index < sources.length; index += batchSize) {
    if (document.hidden) {
      await waitForGalleryIdle(2400);
    } else {
      await waitForGalleryIdle();
    }

    const batch = sources.slice(index, index + batchSize);
    const results = await Promise.all(batch.map((source) => warmBrowserSource(source)));
    successCount += results.filter(Boolean).length;

    if (index + batchSize < sources.length) {
      await new Promise<void>((resolve) => window.setTimeout(resolve, delayBetweenBatches));
    }
  }

  return sources.length === 0 || successCount === sources.length;
}

export function loadGalleryTexture(src: string) {
  const cachedTexture = textureCache.get(src);

  if (cachedTexture) {
    return Promise.resolve(cachedTexture);
  }

  const cachedPromise = texturePromiseCache.get(src);

  if (cachedPromise) {
    return cachedPromise;
  }

  const texturePromise = new Promise<THREE.Texture | null>((resolve) => {
    textureLoader.load(
      src,
      (texture: THREE.Texture) => {
        configureTexture(texture, src);
        textureCache.set(src, texture);

        textureUpdateListeners.forEach((listener) => {
          listener(src, texture);
        });

        resolve(texture);
      },
      undefined,
      () => {
        console.warn(`Could not load gallery texture: ${src}`);
        texturePromiseCache.delete(src);
        resolve(null);
      }
    );
  });

  texturePromiseCache.set(src, texturePromise);

  return texturePromise;
}

export async function preloadGalleryTextures(
  sources: TextureSource[],
  tier: GalleryQualityTier
) {
  const settings = getGalleryQualitySettings(tier);
  const previewSources = getUniqueSources(sources.map((source) => source.previewImage));
  const fullSources = getUniqueSources(sources.map((source) => source.image));
  const initialPreviewSources = previewSources.slice(0, settings.initialPreviewTextureCount);
  const deferredPreviewSources = previewSources.slice(settings.initialPreviewTextureCount);

  await loadPreviewTexturesInBatches(initialPreviewSources, settings.textureLoadBatchSize);

  scheduleTextureBatchLoad(
    deferredPreviewSources,
    settings.textureLoadBatchSize,
    160
  );

  if (settings.fullTextureLoadDelay !== null) {
    scheduleTextureBatchLoad(
      fullSources,
      settings.textureLoadBatchSize,
      settings.fullTextureLoadDelay
    );
  }
}

export async function prewarmGalleryAssetCache(
  sources: TextureSource[],
  targetTier: GalleryQualityTier
) {
  const previewSources = getUniqueSources(sources.map((source) => source.previewImage));
  const fullSources = getUniqueSources(sources.map((source) => source.image));

  const previewReady = await warmBrowserSourcesInBatches(previewSources, 2, 110);
  if (previewReady) {
    markGalleryCacheTierReady('balanced');
  }

  if (targetTier !== 'high') {
    return previewReady;
  }

  await new Promise<void>((resolve) => window.setTimeout(resolve, 520));
  const fullReady = await warmBrowserSourcesInBatches(fullSources, 1, 180);

  if (previewReady && fullReady) {
    markGalleryCacheTierReady('high');
  }

  return previewReady && fullReady;
}

export function loadGalleryArtworkTextureOnDemand(source: TextureSource) {
  return loadGalleryTexture(source.image);
}

export function getCachedGalleryTexture(src: string) {
  return textureCache.get(src) ?? null;
}

export function subscribeToGalleryTextureUpdates(listener: TextureUpdateListener) {
  textureUpdateListeners.add(listener);

  return () => {
    textureUpdateListeners.delete(listener);
  };
}

export function disposeGalleryTextureCache() {
  textureCache.forEach((texture) => texture.dispose());
  textureCache.clear();
  texturePromiseCache.clear();
  textureUpdateListeners.clear();
}
