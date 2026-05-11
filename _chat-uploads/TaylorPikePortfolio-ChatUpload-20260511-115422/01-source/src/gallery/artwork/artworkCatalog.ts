// Gallery artwork catalog.
//
// This file turns the shared gallery image data from src/data/images.ts
// into the format used by the 3D gallery.
//
// To add or edit gallery images, start in src/data/images.ts.
// This file should usually not need much manual editing.

import { galleryImages, type GalleryCategory } from '../../data/images';

export type ArtworkCategory = GalleryCategory;

export type EditableArtwork = {
  id: string;
  title: string;
  category: ArtworkCategory;
  year: string;
  location: string;
  note: string;
  image: string;
  alt: string;
};

export const artworkCatalog: EditableArtwork[] = galleryImages.map((image) => ({
  id: image.id,
  title: image.title,
  category: image.category,
  year: image.year,
  location: image.location,
  note: image.note,
  image: image.src,
  alt: image.alt
}));
