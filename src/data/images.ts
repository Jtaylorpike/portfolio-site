// Shared image data used by the traditional portfolio, hero slideshow,
// and virtual gallery artwork catalog.
//
// Editable image records live in galleryImages.json so a local editor can
// modify the data without generating TypeScript.
//
// Public image paths are normalized through import.meta.env.BASE_URL so the same
// JSON can work locally at "/" and on GitHub Pages at "/portfolio-site/".

import galleryImagesJson from './galleryImages.json';

export type GalleryCategory = string;

export type ImageOrientation = 'landscape' | 'portrait' | 'square';
export type GalleryFitMode = 'cover' | 'contain';
export type GalleryFrameStyle = 'auto' | 'landscape' | 'portrait' | 'square';
export type HeroFrameStyle = 'auto' | 'landscape' | 'portrait' | 'square';
export type HeroFitMode = 'cover' | 'contain';

export type CardImage = {
  title: string;
  src: string;
  alt: string;
};

export type GalleryImage = {
  id: string;
  title: string;
  category: GalleryCategory;
  year: string;
  location: string;
  note: string;

  src: string;
  thumbSrc?: string;
  textureSrc?: string;
  fullSrc?: string;
  alt: string;

  imageWidth?: number;
  imageHeight?: number;
  imageAspectRatio?: number;
  imageOrientation?: ImageOrientation;

  thumbnailPosition?: string;
  heroPosition?: string;
  heroFrameStyle?: HeroFrameStyle;
  heroFitMode?: HeroFitMode;

  galleryPosition?: string;
  galleryFitMode?: GalleryFitMode;
  galleryFrameStyle?: GalleryFrameStyle;
  gallerySize?: number;
};

function isExternalOrSpecialUrl(value: string) {
  return /^(https?:|data:|blob:|#)/i.test(value);
}

function getBaseUrl() {
  const baseUrl = import.meta.env.BASE_URL || '/';

  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
}

export function resolvePublicAssetPath(path: string): string {
  if (!path || isExternalOrSpecialUrl(path)) {
    return path;
  }

  const baseUrl = getBaseUrl();

  if (path.startsWith('/')) {
    return `${baseUrl}${path.slice(1)}`;
  }

  return `${baseUrl}${path}`;
}

function resolveOptionalPublicAssetPath(path: string | undefined): string | undefined {
  return path ? resolvePublicAssetPath(path) : undefined;
}

function resolveCardImage(card: CardImage): CardImage {
  return {
    ...card,
    src: resolvePublicAssetPath(card.src)
  };
}

function resolveGalleryImage(image: GalleryImage): GalleryImage {
  return {
    ...image,
    src: resolvePublicAssetPath(image.src),
    thumbSrc: resolveOptionalPublicAssetPath(image.thumbSrc),
    textureSrc: resolveOptionalPublicAssetPath(image.textureSrc),
    fullSrc: resolveOptionalPublicAssetPath(image.fullSrc)
  };
}

const rawCardImages = {
  climbing: {
    title: 'Climbing',
    src: '/images/card-optimized/climbing-01.webp',
    alt: 'Climbing photograph by Taylor Pike'
  },
  commercial: {
    title: 'Commercial',
    src: '/images/card-optimized/commercial-01.webp',
    alt: 'Commercial photograph by Taylor Pike'
  },
  portraits: {
    title: 'Portraits',
    src: '/images/card-optimized/portrait-01.webp',
    alt: 'Portrait photograph by Taylor Pike'
  },
  productBrand: {
    title: 'Product / Brand',
    src: '/images/card-optimized/product-01.webp',
    alt: 'Product and brand photograph by Taylor Pike'
  },
  personal: {
    title: 'Personal Work',
    src: '/images/card-optimized/personal-01.webp',
    alt: 'Personal photograph by Taylor Pike'
  }
} satisfies Record<string, CardImage>;

export const cardImages = Object.fromEntries(
  Object.entries(rawCardImages).map(([key, card]) => {
    return [key, resolveCardImage(card)];
  })
) as Record<keyof typeof rawCardImages, CardImage>;

export const galleryImages = (galleryImagesJson as GalleryImage[]).map(resolveGalleryImage);
