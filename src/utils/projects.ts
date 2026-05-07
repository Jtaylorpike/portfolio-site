// Homepage project card data.
//
// This file controls the normal portfolio cards on the homepage.
// The image paths come from src/data/images.ts so there is one shared place
// to manage optimized image files.

import { cardImages } from '../data/images';

export type Project = {
  title: string;
  category: string;
  year: string;
  description: string;
  coverImage: string;
};

export const projects: Project[] = [
  {
    title: 'Climbing',
    category: 'Climbing',
    year: '2026',
    description: 'Photos from climbing and the places around it. This is the work that feels closest to how I spend my time outside.',
    coverImage: cardImages.climbing.src
  },
  {
    title: 'Commercial',
    category: 'Commercial',
    year: '2026',
    description: 'Work made for businesses, products, and people who need images that feel clean and usable without feeling fake.',
    coverImage: cardImages.commercial.src
  },
  {
    title: 'Portraits',
    category: 'Portrait',
    year: '2026',
    description: 'Portraits that try to keep things simple. I care more about the person looking natural than making the image feel overworked.',
    coverImage: cardImages.portraits.src
  },
  {
    title: 'Product / Brand',
    category: 'Product',
    year: '2026',
    description: 'Product and brand photos focused on shape, texture, light, and showing the thing clearly.',
    coverImage: cardImages.productBrand.src
  },
  {
    title: 'Personal Work',
    category: 'Personal',
    year: '2026',
    description: 'Personal photos from places I have lived, trips I have taken, and things I wanted to remember.',
    coverImage: cardImages.personal.src
  }
];