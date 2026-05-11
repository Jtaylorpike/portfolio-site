// Controls the dev-only image editor.
//
// This gathers the edited form values and generates replacement JSON for:
// - src/data/galleryImages.json
// - src/data/heroSlides.json

type GalleryCategory = 'climbing' | 'landscape' | 'personal';

type EditedImage = {
  id: string;
  title: string;
  category: GalleryCategory;
  year: string;
  location: string;
  note: string;
  src: string;
  alt: string;
  fullSrc?: string;
  isHeroSlide: boolean;
  heroTargetCategory: GalleryCategory;
};

function cleanString(value: string) {
  return value.trim();
}

function getInputValue(card: HTMLElement, field: string) {
  const input = card.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`[data-field="${field}"]`);

  return cleanString(input?.value ?? '');
}

function getCheckboxValue(card: HTMLElement, field: string) {
  const input = card.querySelector<HTMLInputElement>(`[data-field="${field}"]`);

  return Boolean(input?.checked);
}

function getEditedImages() {
  const cards = document.querySelectorAll<HTMLElement>('[data-editor-image-card]');

  return Array.from(cards).map((card): EditedImage => {
    return {
      id: getInputValue(card, 'id'),
      title: getInputValue(card, 'title'),
      category: getInputValue(card, 'category') as GalleryCategory,
      year: getInputValue(card, 'year'),
      location: getInputValue(card, 'location'),
      note: getInputValue(card, 'note'),
      src: getInputValue(card, 'src'),
      alt: getInputValue(card, 'alt'),
      fullSrc: getInputValue(card, 'fullSrc') || undefined,
      isHeroSlide: getCheckboxValue(card, 'isHeroSlide'),
      heroTargetCategory: getInputValue(card, 'heroTargetCategory') as GalleryCategory
    };
  });
}

function getGalleryImagesJson(images: EditedImage[]) {
  const galleryImages = images.map((image) => {
    const output = {
      id: image.id,
      title: image.title,
      category: image.category,
      year: image.year,
      location: image.location,
      note: image.note,
      src: image.src,
      alt: image.alt,
      fullSrc: image.fullSrc
    };

    if (!output.fullSrc) {
      delete output.fullSrc;
    }

    return output;
  });

  return JSON.stringify(galleryImages, null, 2);
}

function getHeroSlidesJson(images: EditedImage[]) {
  const heroSlides = images
    .filter((image) => image.isHeroSlide)
    .map((image) => {
      return {
        imageId: image.id,
        targetCategory: image.heroTargetCategory
      };
    });

  return JSON.stringify(heroSlides, null, 2);
}

function generateEditorOutput() {
  const images = getEditedImages();

  return `/* ================================
src/data/galleryImages.json
================================ */

${getGalleryImagesJson(images)}

/* ================================
src/data/heroSlides.json
================================ */

${getHeroSlidesJson(images)}
`;
}

async function copyOutputToClipboard() {
  const output = document.querySelector<HTMLTextAreaElement>('[data-editor-output]');

  if (!output) {
    return;
  }

  if (!output.value.trim()) {
    output.value = generateEditorOutput();
  }

  await navigator.clipboard.writeText(output.value);
}

export function setupImageEditorController() {
  const exportButtons = document.querySelectorAll<HTMLButtonElement>('[data-export-images]');
  const copyButton = document.querySelector<HTMLButtonElement>('[data-copy-images-output]');
  const output = document.querySelector<HTMLTextAreaElement>('[data-editor-output]');

  exportButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (output) {
        output.value = generateEditorOutput();
      }
    });
  });

  copyButton?.addEventListener('click', () => {
    copyOutputToClipboard().catch((error) => {
      console.error('Could not copy editor output:', error);
    });
  });
}