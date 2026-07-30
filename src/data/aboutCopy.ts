// About/contact page copy data.
//
// Final public-facing copy is user-authored. This module gives the public site
// a typed, data-backed structure so the local editor can manage placeholder or
// final About/contact copy without hardcoding prose in sitePages.ts.

import aboutCopyJson from './aboutCopy.json';

export type AboutCopyTextSection = {
  eyebrow: string;
  heading: string;
  paragraphs: string[];
};

export type AboutCopyHeroSection = {
  eyebrow: string;
  headline: string;
  intro: string;
};

export type AboutCopyContactLink = {
  label: string;
  url: string;
};

export type AboutCopyContactSection = {
  eyebrow: string;
  headline: string;
  body: string;
  email: string;
  links: AboutCopyContactLink[];
};

export type AboutCopy = {
  schemaVersion: number;
  hero: AboutCopyHeroSection;
  about: AboutCopyTextSection;
  project: AboutCopyTextSection;
  contact: AboutCopyContactSection;
};

export const defaultAboutCopy: AboutCopy = {
  schemaVersion: 1,
  hero: {
    eyebrow: 'About / Contact',
    headline: 'Photography shaped by movement, landscape, and time outside.',
    intro: 'Photographer and multidisciplinary creative working across images, environments, and digital spaces.'
  },
  about: {
    eyebrow: 'About Me',
    heading: 'Photography, climbing, and time spent outside.',
    paragraphs: [
      'Placeholder copy. Use this block for the short version of who you are, where you are from, and what shaped your creative point of view.',
      'Placeholder copy. Use this second paragraph for photography, climbing, community, technical work, and the personal thread between them.'
    ]
  },
  project: {
    eyebrow: 'Photography / Project',
    heading: 'Building an archive on my own terms.',
    paragraphs: [
      'Placeholder copy. Use this block for how you think about photography, climbing, landscape, portrait work, commercial work, visual storytelling, and building this site as an evolving archive.',
      'Placeholder copy. Use this block for the bridge between photography, editing, web development, support work, and the interactive gallery concept.'
    ]
  },
  contact: {
    eyebrow: 'Contact',
    headline: 'Available for selected projects, collaborations, and image work.',
    body: 'Placeholder copy. Replace this with your preferred contact language and availability notes.',
    email: 'jtaylorpike@gmail.com',
    links: []
  }
};

function cleanText(value: unknown, fallback: string): string {
  if (typeof value !== 'string') {
    return fallback;
  }

  const cleanValue = value.trim();

  return cleanValue || fallback;
}

function normalizeParagraphs(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  const paragraphs = value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .slice(0, 4);

  return paragraphs.length ? paragraphs : [...fallback];
}

function normalizeLinks(value: unknown): AboutCopyContactLink[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const rawLink = item as Partial<AboutCopyContactLink>;
      const label = typeof rawLink.label === 'string' ? rawLink.label.trim() : '';
      const url = typeof rawLink.url === 'string' ? rawLink.url.trim() : '';

      if (!label || !url) {
        return null;
      }

      return { label, url };
    })
    .filter((item): item is AboutCopyContactLink => item !== null)
    .slice(0, 6);
}

function normalizeAboutCopy(rawCopy: unknown): AboutCopy {
  const copy = rawCopy && typeof rawCopy === 'object'
    ? rawCopy as Partial<AboutCopy>
    : {};

  return {
    schemaVersion: 1,
    hero: {
      eyebrow: cleanText(copy.hero?.eyebrow, defaultAboutCopy.hero.eyebrow),
      headline: cleanText(copy.hero?.headline, defaultAboutCopy.hero.headline),
      intro: cleanText(copy.hero?.intro, defaultAboutCopy.hero.intro)
    },
    about: {
      eyebrow: cleanText(copy.about?.eyebrow, defaultAboutCopy.about.eyebrow),
      heading: cleanText(copy.about?.heading, defaultAboutCopy.about.heading),
      paragraphs: normalizeParagraphs(copy.about?.paragraphs, defaultAboutCopy.about.paragraphs)
    },
    project: {
      eyebrow: cleanText(copy.project?.eyebrow, defaultAboutCopy.project.eyebrow),
      heading: cleanText(copy.project?.heading, defaultAboutCopy.project.heading),
      paragraphs: normalizeParagraphs(copy.project?.paragraphs, defaultAboutCopy.project.paragraphs)
    },
    contact: {
      eyebrow: cleanText(copy.contact?.eyebrow, defaultAboutCopy.contact.eyebrow),
      headline: cleanText(copy.contact?.headline, defaultAboutCopy.contact.headline),
      body: cleanText(copy.contact?.body, defaultAboutCopy.contact.body),
      email: cleanText(copy.contact?.email, defaultAboutCopy.contact.email),
      links: normalizeLinks(copy.contact?.links)
    }
  };
}

export const aboutCopy = normalizeAboutCopy(aboutCopyJson);
