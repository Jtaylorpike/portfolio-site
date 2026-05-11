// Hero slideshow data for the traditional home page.
//
// Editable hero slide records live in heroSlides.json so a local editor can
// modify the slideshow without generating TypeScript.

import heroSlidesJson from './heroSlides.json';
import type { GalleryCategory } from './images';

export type HeroSlide = {
  imageId: string;
  targetCategory: GalleryCategory;
};

export const heroSlides = heroSlidesJson as HeroSlide[];