// Three.js gallery texture loader.
//
// The loader caches textures by image path so the gallery does not keep
// creating new GPU texture resources for the same files.
//
// Phase 8AI keeps the first visible room responsive by loading only the
// priority preview textures before scene construction, then streaming the
// remaining previews and full artwork textures in small idle batches. This
// prevents the fullscreen loader from feeling frozen while larger WebP
// textures decode and upload to the GPU.

import * as THREE from 'three';

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

const initialPreviewTextureCount = 4;
const textureLoadBatchSize = 2;

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

function requestGalleryIdle(callback: () => void, timeout = 1200) {
  const idleWindow = window as IdleWindow;

  if (idleWindow.requestIdleCallback) {
    idleWindow.requestIdleCallback(callback, { timeout });
    return;
  }

  window.setTimeout(callback, 120);
}

function scheduleTextureBatchLoad(sources: string[], delay = 0) {
  const queue = [...sources];

  if (queue.length === 0) {
    return;
  }

  const loadNextBatch = () => {
    queue.splice(0, textureLoadBatchSize).forEach((source) => {
      void loadGalleryTexture(source);
    });

    if (queue.length > 0) {
      window.setTimeout(() => {
        requestGalleryIdle(loadNextBatch);
      }, 120);
    }
  };

  window.setTimeout(() => {
    requestGalleryIdle(loadNextBatch);
  }, delay);
}

async function loadPreviewTexturesInBatches(sources: string[]) {
  for (let index = 0; index < sources.length; index += textureLoadBatchSize) {
    const batch = sources.slice(index, index + textureLoadBatchSize);

    await Promise.all(batch.map((source) => loadGalleryTexture(source)));

    if (index + textureLoadBatchSize < sources.length) {
      await waitForNextPaint();
    }
  }
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

export async function preloadGalleryTextures(sources: TextureSource[]) {
  const previewSources = getUniqueSources(sources.map((source) => source.previewImage));
  const fullSources = getUniqueSources(sources.map((source) => source.image));
  const initialPreviewSources = previewSources.slice(0, initialPreviewTextureCount);
  const deferredPreviewSources = previewSources.slice(initialPreviewTextureCount);

  await loadPreviewTexturesInBatches(initialPreviewSources);

  // Stream all non-critical texture work after the room starts opening. The
  // GalleryScene subscriber applies these textures as each image finishes.
  scheduleTextureBatchLoad(deferredPreviewSources, 160);
  scheduleTextureBatchLoad(fullSources, 520);
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
