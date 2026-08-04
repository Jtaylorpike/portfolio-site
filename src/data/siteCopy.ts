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
  navigation: {
    home: string;
    portfolio: string;
    gallery: string;
    about: string;
  };
  portfolio: {
    eyebrow: string;
    headline: string;
    allWork: string;
  };
  footer: {
    owner: string;
    rights: string;
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
  },
  navigation: {
    home: 'Home',
    portfolio: 'Portfolio',
    gallery: 'Gallery',
    about: 'About'
  },
  portfolio: {
    eyebrow: 'Portfolio',
    headline: 'A visual index of climbing, landscape, personal work, and experimental image studies.',
    allWork: 'All Work'
  },
  footer: {
    owner: 'Taylor Pike',
    rights: 'All rights reserved.'
  }
};

function cleanText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function normalizeSiteCopy(value: unknown): SiteCopy {
  const source = value && typeof value === 'object' ? value as Partial<SiteCopy> : {};
  const entry: Partial<SiteCopy['entry']> = source.entry && typeof source.entry === 'object' ? source.entry : {};
  const home: Partial<SiteCopy['home']> = source.home && typeof source.home === 'object' ? source.home : {};
  const navigation: Partial<SiteCopy['navigation']> = source.navigation && typeof source.navigation === 'object' ? source.navigation : {};
  const portfolio: Partial<SiteCopy['portfolio']> = source.portfolio && typeof source.portfolio === 'object' ? source.portfolio : {};
  const footer: Partial<SiteCopy['footer']> = source.footer && typeof source.footer === 'object' ? source.footer : {};

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
    },
    navigation: {
      home: cleanText(navigation.home, fallbackSiteCopy.navigation.home),
      portfolio: cleanText(navigation.portfolio, fallbackSiteCopy.navigation.portfolio),
      gallery: cleanText(navigation.gallery, fallbackSiteCopy.navigation.gallery),
      about: cleanText(navigation.about, fallbackSiteCopy.navigation.about)
    },
    portfolio: {
      eyebrow: cleanText(portfolio.eyebrow, fallbackSiteCopy.portfolio.eyebrow),
      headline: cleanText(portfolio.headline, fallbackSiteCopy.portfolio.headline),
      allWork: cleanText(portfolio.allWork, fallbackSiteCopy.portfolio.allWork)
    },
    footer: {
      owner: cleanText(footer.owner, fallbackSiteCopy.footer.owner),
      rights: cleanText(footer.rights, fallbackSiteCopy.footer.rights)
    }
  };
}

export const siteCopy = normalizeSiteCopy(siteCopyJson);
