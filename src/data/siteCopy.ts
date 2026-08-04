import siteCopyJson from './siteCopy.json';

export type SiteCopy = {
  schemaVersion: 1;
  entry: {
    eyebrow: string;
    headline: string;
    body: string;
    primaryAction: string;
    galleryAction: string;
  };
  home: {
    eyebrow: string;
    statement: string;
    galleryAction: string;
    portfolioAction: string;
  };
};

const fallbackSiteCopy: SiteCopy = {
  schemaVersion: 1,
  entry: {
    eyebrow: 'Creative Portfolio',
    headline: 'A visual archive for photography, climbing, landscape, and experimental web spaces.',
    body: 'Enter the traditional portfolio or move through the work in the desktop virtual gallery.',
    primaryAction: 'Continue to Website',
    galleryAction: 'Enter Virtual Gallery'
  },
  home: {
    eyebrow: 'Selected Work',
    statement: 'A visual archive of movement, space, and imagination.',
    galleryAction: 'Enter Virtual Gallery',
    portfolioAction: 'View Portfolio'
  }
};

function cleanText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function normalizeSiteCopy(value: unknown): SiteCopy {
  const source = value && typeof value === 'object' ? value as Partial<SiteCopy> : {};
  const entry: Partial<SiteCopy['entry']> = source.entry && typeof source.entry === 'object' ? source.entry : {};
  const home: Partial<SiteCopy['home']> = source.home && typeof source.home === 'object' ? source.home : {};

  return {
    schemaVersion: 1,
    entry: {
      eyebrow: cleanText(entry.eyebrow, fallbackSiteCopy.entry.eyebrow),
      headline: cleanText(entry.headline, fallbackSiteCopy.entry.headline),
      body: cleanText(entry.body, fallbackSiteCopy.entry.body),
      primaryAction: cleanText(entry.primaryAction, fallbackSiteCopy.entry.primaryAction),
      galleryAction: cleanText(entry.galleryAction, fallbackSiteCopy.entry.galleryAction)
    },
    home: {
      eyebrow: cleanText(home.eyebrow, fallbackSiteCopy.home.eyebrow),
      statement: cleanText(home.statement, fallbackSiteCopy.home.statement),
      galleryAction: cleanText(home.galleryAction, fallbackSiteCopy.home.galleryAction),
      portfolioAction: cleanText(home.portfolioAction, fallbackSiteCopy.home.portfolioAction)
    }
  };
}

export const siteCopy = normalizeSiteCopy(siteCopyJson);
