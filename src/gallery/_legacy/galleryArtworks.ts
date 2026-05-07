export type GalleryArtwork = {
  title: string;
  category: 'climbing' | 'landscape' | 'personal';
  image: string;
  position: [number, number, number];
  rotationY: number;
  width: number;
  height: number;
};

export const galleryArtworks: GalleryArtwork[] = [
  {
    title: 'Climbing 01',
    category: 'climbing',
    image: '/images/climbing/climbing-portfolio-01.jpg',
    position: [-3.6, 2, -8.95],
    rotationY: 0,
    width: 2.2,
    height: 1.45
  },
  {
    title: 'Landscape 01',
    category: 'landscape',
    image: '/images/landscape/landscape-portfolio-01.jpg',
    position: [0, 2, -8.95],
    rotationY: 0,
    width: 2.2,
    height: 1.45
  },
  {
    title: 'Personal 01',
    category: 'personal',
    image: '/images/personal/personal-portfolio-01.jpg',
    position: [3.6, 2, -8.95],
    rotationY: 0,
    width: 2.2,
    height: 1.45
  },
  {
    title: 'Climbing 02',
    category: 'climbing',
    image: '/images/climbing/climbing-portfolio-02.jpg',
    position: [-6.95, 2, -3.8],
    rotationY: Math.PI / 2,
    width: 2,
    height: 1.35
  },
  {
    title: 'Climbing 03',
    category: 'climbing',
    image: '/images/climbing/climbing-portfolio-03.jpg',
    position: [-6.95, 2, 1.2],
    rotationY: Math.PI / 2,
    width: 2,
    height: 1.35
  },
  {
    title: 'Landscape 02',
    category: 'landscape',
    image: '/images/landscape/landscape-portfolio-02.jpg',
    position: [6.95, 2, -3.8],
    rotationY: -Math.PI / 2,
    width: 2,
    height: 1.35
  },
  {
    title: 'Landscape 03',
    category: 'landscape',
    image: '/images/landscape/landscape-portfolio-03.jpg',
    position: [6.95, 2, 1.2],
    rotationY: -Math.PI / 2,
    width: 2,
    height: 1.35
  }
];