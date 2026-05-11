import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const projectRoot = 'C:/Users/jtayl/portfolio-site';

const cardImages = [
  {
    source: 'public/images/climbing/climbing-01.jpg',
    output: 'public/images/card-optimized/climbing-01.webp'
  },
  {
    source: 'public/images/commercial/commercial-01.jpg',
    output: 'public/images/card-optimized/commercial-01.webp'
  },
  {
    source: 'public/images/portraits/portrait-01.jpg',
    output: 'public/images/card-optimized/portrait-01.webp'
  },
  {
    source: 'public/images/product-brand/product-01.jpg',
    output: 'public/images/card-optimized/product-01.webp'
  },
  {
    source: 'public/images/personal/personal-01.jpg',
    output: 'public/images/card-optimized/personal-01.webp'
  }
];

const galleryImages = [
  {
    source: 'public/images/climbing/climbing-portfolio-01.jpg',
    output: 'public/images/gallery-optimized/climbing-portfolio-01.webp'
  },
  {
    source: 'public/images/landscape/landscape-portfolio-01.jpg',
    output: 'public/images/gallery-optimized/landscape-portfolio-01.webp'
  },
  {
    source: 'public/images/personal/personal-portfolio-01.jpg',
    output: 'public/images/gallery-optimized/personal-portfolio-01.webp'
  },
  {
    source: 'public/images/climbing/climbing-portfolio-02.jpg',
    output: 'public/images/gallery-optimized/climbing-portfolio-02.webp'
  },
  {
    source: 'public/images/climbing/climbing-portfolio-03.jpg',
    output: 'public/images/gallery-optimized/climbing-portfolio-03.webp'
  },
  {
    source: 'public/images/landscape/landscape-portfolio-02.jpg',
    output: 'public/images/gallery-optimized/landscape-portfolio-02.webp'
  },
  {
    source: 'public/images/landscape/landscape-portfolio-03.jpg',
    output: 'public/images/gallery-optimized/landscape-portfolio-03.webp'
  }
];

async function optimizeImage({ source, output, maxSize, quality }) {
  const sourcePath = path.join(projectRoot, source);
  const outputPath = path.join(projectRoot, output);
  const outputFolder = path.dirname(outputPath);

  await fs.mkdir(outputFolder, { recursive: true });

  try {
    const before = await fs.stat(sourcePath);

    await sharp(sourcePath)
      .rotate()
      .resize({
        width: maxSize,
        height: maxSize,
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({
        quality,
        effort: 5
      })
      .toFile(outputPath);

    const after = await fs.stat(outputPath);

    const beforeMB = (before.size / 1024 / 1024).toFixed(2);
    const afterMB = (after.size / 1024 / 1024).toFixed(2);

    console.log(`${source}`);
    console.log(`  ${beforeMB} MB -> ${afterMB} MB`);
    console.log(`  saved as ${output}`);
  } catch (error) {
    console.warn(`Could not optimize: ${source}`);
    console.warn(error.message);
  }
}

async function main() {
  console.log('');
  console.log('Optimizing homepage card images...');
  console.log('');

  for (const image of cardImages) {
    await optimizeImage({
      ...image,
      maxSize: 1200,
      quality: 80
    });
  }

  console.log('');
  console.log('Optimizing 3D gallery images...');
  console.log('');

  for (const image of galleryImages) {
    await optimizeImage({
      ...image,
      maxSize: 1600,
      quality: 78
    });
  }

  console.log('');
  console.log('Done.');
  console.log('');
}

main();