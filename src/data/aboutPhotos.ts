// About/contact page image data.
//
// Editable about photo records live in aboutPhotos.json so the local editor can
// manage About-page-specific imagery separately from the portfolio archive.
// Imported About photos should use public/images/about/, not public/images/portfolio/.

import aboutPhotosJson from './aboutPhotos.json';
import { resolvePublicAssetPath, type ImageOrientation } from './images';

export type AboutPhotoPlacement = 'upper-collage' | 'lower-collage' | 'background-float' | 'unused';

export type AboutPhoto = {
  id: string;
  title: string;
  year?: string;
  location?: string;
  note?: string;
  src: string;
  thumbSrc?: string;
  fullSrc?: string;
  alt: string;
  imageWidth?: number;
  imageHeight?: number;
  imageAspectRatio?: number;
  imageOrientation?: ImageOrientation;
  isActive?: boolean;
  placementRole?: AboutPhotoPlacement;
  aboutPosition?: string;
  aboutScale?: number;
  backgroundX?: number;
  backgroundY?: number;
  backgroundWidth?: number;
  collageX?: number;
  collageY?: number;
  collageWidth?: number;
  sourceType?: 'about' | 'portfolio-reference';
  sourceImageId?: string;
};

function resolveOptionalPublicAssetPath(path: string | undefined): string | undefined {
  return path ? resolvePublicAssetPath(path) : undefined;
}

function resolveAboutPhoto(photo: AboutPhoto): AboutPhoto {
  return {
    ...photo,
    src: resolvePublicAssetPath(photo.src),
    thumbSrc: resolveOptionalPublicAssetPath(photo.thumbSrc),
    fullSrc: resolveOptionalPublicAssetPath(photo.fullSrc)
  };
}

function isActiveAboutPhoto(photo: AboutPhoto): boolean {
  return photo.isActive !== false;
}

export const allAboutPhotos = (aboutPhotosJson as AboutPhoto[]).map(resolveAboutPhoto);
export const aboutPhotos = allAboutPhotos.filter(isActiveAboutPhoto);
