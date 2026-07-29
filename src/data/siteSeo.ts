// Site-level SEO metadata.
//
// This is infrastructure copy, not final launch copy. The structure keeps titles,
// descriptions, social preview defaults, and structured-data inputs in one typed
// place so future launch copy can be edited without hunting through controllers.

import siteSeoJson from './siteSeo.json';

export type SiteSeoRouteKey = 'entry' | 'home' | 'portfolio' | 'about' | 'gallery';

export type SiteSeoRoute = {
  title: string;
  description: string;
  canonicalPath: string;
  image?: string;
};

export type SiteSeoConfig = {
  schemaVersion: number;
  siteName: string;
  authorName: string;
  siteUrl: string;
  locale: string;
  themeColor: string;
  defaultImage: string;
  contactEmail: string;
  sameAs: string[];
  keywords: string[];
  routes: Record<SiteSeoRouteKey, SiteSeoRoute>;
};

const fallbackSeo: SiteSeoConfig = {
  schemaVersion: 1,
  siteName: 'Taylor Pike',
  authorName: 'Taylor Pike',
  siteUrl: 'https://taylorpike.com/',
  locale: 'en_US',
  themeColor: '#060807',
  defaultImage: '/images/portfolio/display/climbing-01.webp',
  contactEmail: 'jtaylorpike@gmail.com',
  sameAs: [],
  keywords: [
    'photography',
    'climbing photography',
    'landscape photography',
    'commercial photography',
    'interactive web gallery'
  ],
  routes: {
    entry: {
      title: 'Taylor Pike | Photography Portfolio',
      description: 'Photography portfolio by Taylor Pike featuring climbing, landscape, personal, and commercial image work, plus an interactive virtual gallery.',
      canonicalPath: '/'
    },
    home: {
      title: 'Taylor Pike | Photography Portfolio',
      description: 'Photography portfolio by Taylor Pike featuring climbing, landscape, personal, and commercial image work, plus an interactive virtual gallery.',
      canonicalPath: '/'
    },
    portfolio: {
      title: 'Portfolio | Taylor Pike',
      description: 'A visual index of Taylor Pike photography, including climbing, landscape, personal, commercial, and experimental image work.',
      canonicalPath: '/'
    },
    about: {
      title: 'About / Contact | Taylor Pike',
      description: 'About and contact page for Taylor Pike, a photography portfolio and evolving interactive image archive.',
      canonicalPath: '/'
    },
    gallery: {
      title: 'Virtual Gallery | Taylor Pike',
      description: 'An interactive 3D gallery space for selected Taylor Pike photography and image archive work.',
      canonicalPath: '/'
    }
  }
};

function cleanText(value: unknown, fallback: string): string {
  if (typeof value !== 'string') {
    return fallback;
  }

  const cleanValue = value.trim();

  return cleanValue || fallback;
}

function cleanUrl(value: unknown, fallback: string): string {
  const cleanValue = cleanText(value, fallback);

  if (/^https?:\/\//i.test(cleanValue) || cleanValue.startsWith('/')) {
    return cleanValue;
  }

  return fallback;
}

function cleanStringList(value: unknown, fallback: string[], limit: number): string[] {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  const cleanValues = value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .slice(0, limit);

  return cleanValues.length ? cleanValues : [...fallback];
}

function normalizeRoute(value: unknown, fallback: SiteSeoRoute): SiteSeoRoute {
  const route = value && typeof value === 'object' ? value as Partial<SiteSeoRoute> : {};

  return {
    title: cleanText(route.title, fallback.title),
    description: cleanText(route.description, fallback.description),
    canonicalPath: cleanText(route.canonicalPath, fallback.canonicalPath),
    image: route.image ? cleanUrl(route.image, fallback.image ?? fallbackSeo.defaultImage) : fallback.image
  };
}

function normalizeSiteSeo(rawValue: unknown): SiteSeoConfig {
  const rawConfig = rawValue && typeof rawValue === 'object'
    ? rawValue as Partial<SiteSeoConfig>
    : {};

  const rawRoutes = rawConfig.routes && typeof rawConfig.routes === 'object'
    ? rawConfig.routes as Partial<Record<SiteSeoRouteKey, unknown>>
    : {};

  return {
    schemaVersion: 1,
    siteName: cleanText(rawConfig.siteName, fallbackSeo.siteName),
    authorName: cleanText(rawConfig.authorName, fallbackSeo.authorName),
    siteUrl: cleanUrl(rawConfig.siteUrl, fallbackSeo.siteUrl).replace(/\/?$/, '/'),
    locale: cleanText(rawConfig.locale, fallbackSeo.locale),
    themeColor: cleanText(rawConfig.themeColor, fallbackSeo.themeColor),
    defaultImage: cleanUrl(rawConfig.defaultImage, fallbackSeo.defaultImage),
    contactEmail: cleanText(rawConfig.contactEmail, fallbackSeo.contactEmail),
    sameAs: cleanStringList(rawConfig.sameAs, fallbackSeo.sameAs, 12),
    keywords: cleanStringList(rawConfig.keywords, fallbackSeo.keywords, 20),
    routes: {
      entry: normalizeRoute(rawRoutes.entry, fallbackSeo.routes.entry),
      home: normalizeRoute(rawRoutes.home, fallbackSeo.routes.home),
      portfolio: normalizeRoute(rawRoutes.portfolio, fallbackSeo.routes.portfolio),
      about: normalizeRoute(rawRoutes.about, fallbackSeo.routes.about),
      gallery: normalizeRoute(rawRoutes.gallery, fallbackSeo.routes.gallery)
    }
  };
}

export const siteSeo = normalizeSiteSeo(siteSeoJson);
