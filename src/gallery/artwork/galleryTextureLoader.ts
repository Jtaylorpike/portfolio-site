// Three.js gallery texture loader.
//
// The loader caches textures by image path so the gallery does not keep
// creating new GPU texture resources for the same files.
//
// Preview textures can load first, then higher-resolution textures can replace
// them later through the subscription callback.

import * as THREE from 'three';

type TextureSource = {
  image: string;
  previewImage?: string;
};

type TextureUpdateListener = (url: string, texture: THREE.Texture) => void;

const textureLoader = new THREE.TextureLoader();

const textureCache = new Map<string, THREE.Texture>();
const texturePromiseCache = new Map<string, Promise<THREE.Texture | null>>();
const textureUpdateListeners = new Set<TextureUpdateListener>();

function configureTexture(texture: THREE.Texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
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
        configureTexture(texture);
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
  const previewSources = sources
    .map((source) => source.previewImage)
    .filter((source): source is string => Boolean(source));

  const fullSources = sources
    .map((source) => source.image)
    .filter(Boolean);

  await Promise.all(previewSources.map((source) => loadGalleryTexture(source)));

  fullSources.forEach((source) => {
    loadGalleryTexture(source);
  });
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