// Route-aware SEO metadata controller.
//
// The site uses hash routing for GitHub Pages compatibility. Hash routes do not
// create separately crawlable server paths, but updating metadata on route change
// still improves browser titles, accessibility context, and future migration to
// real routes or prerendered pages.

import { getCategoryLabel } from '../data/categories';
import { siteSeo, type SiteSeoRouteKey, type SiteSeoRoute } from '../data/siteSeo';

type SeoRouteName = SiteSeoRouteKey | 'editor';

export type SeoRouteState = {
  name: SeoRouteName;
  category?: string;
};

function resolveRouteKey(routeName: SeoRouteName): SiteSeoRouteKey {
  if (routeName === 'editor') {
    return 'home';
  }

  return routeName;
}

function trimLeadingSlash(value: string): string {
  return value.replace(/^\/+/, '');
}

function resolveAbsoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  return new URL(trimLeadingSlash(pathOrUrl), siteSeo.siteUrl).toString();
}

function resolveCanonicalUrl(route: SiteSeoRoute): string {
  return resolveAbsoluteUrl(route.canonicalPath || '/');
}

function getMetaElement(selector: string, createElement: () => HTMLMetaElement): HTMLMetaElement {
  const existingElement = document.head.querySelector<HTMLMetaElement>(selector);

  if (existingElement) {
    return existingElement;
  }

  const element = createElement();
  document.head.append(element);

  return element;
}

function setNamedMeta(name: string, content: string): void {
  const element = getMetaElement(`meta[name="${name}"]`, () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', name);
    return meta;
  });

  element.setAttribute('content', content);
}

function setPropertyMeta(property: string, content: string): void {
  const element = getMetaElement(`meta[property="${property}"]`, () => {
    const meta = document.createElement('meta');
    meta.setAttribute('property', property);
    return meta;
  });

  element.setAttribute('content', content);
}

function setCanonicalLink(url: string): void {
  let canonicalLink = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (!canonicalLink) {
    canonicalLink = document.createElement('link');
    canonicalLink.rel = 'canonical';
    document.head.append(canonicalLink);
  }

  canonicalLink.href = url;
}

function getRouteSeo(routeState: SeoRouteState): SiteSeoRoute {
  const routeKey = resolveRouteKey(routeState.name);
  const baseRoute = siteSeo.routes[routeKey];

  if (routeKey !== 'portfolio' || !routeState.category || routeState.category === 'all') {
    return baseRoute;
  }

  const categoryLabel = getCategoryLabel(routeState.category);

  return {
    ...baseRoute,
    title: `${categoryLabel} Portfolio | Taylor Pike`,
    description: `${categoryLabel} photography and image work from the Taylor Pike portfolio archive.`
  };
}

function buildStructuredData(routeState: SeoRouteState, routeSeo: SiteSeoRoute, canonicalUrl: string, imageUrl: string): Record<string, unknown> {
  const routeKey = resolveRouteKey(routeState.name);
  const isGallery = routeKey === 'gallery';

  return {
    '@context': 'https://schema.org',
    '@type': isGallery ? 'CreativeWork' : 'Person',
    '@id': `${siteSeo.siteUrl}#taylor-pike`,
    name: siteSeo.authorName,
    url: canonicalUrl,
    image: imageUrl,
    email: `mailto:${siteSeo.contactEmail}`,
    jobTitle: 'Photographer and creative technologist',
    description: routeSeo.description,
    sameAs: siteSeo.sameAs,
    knowsAbout: siteSeo.keywords,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
      name: routeSeo.title,
      description: routeSeo.description
    }
  };
}

function setStructuredData(routeState: SeoRouteState, routeSeo: SiteSeoRoute, canonicalUrl: string, imageUrl: string): void {
  let script = document.head.querySelector<HTMLScriptElement>('#site-seo-structured-data');

  if (!script) {
    script = document.createElement('script');
    script.id = 'site-seo-structured-data';
    script.type = 'application/ld+json';
    document.head.append(script);
  }

  script.textContent = JSON.stringify(
    buildStructuredData(routeState, routeSeo, canonicalUrl, imageUrl),
    null,
    2
  );
}

export function applySeoForRoute(routeState: SeoRouteState): void {
  const routeSeo = getRouteSeo(routeState);
  const canonicalUrl = resolveCanonicalUrl(routeSeo);
  const imageUrl = resolveAbsoluteUrl(routeSeo.image ?? siteSeo.defaultImage);

  document.title = routeSeo.title;

  setCanonicalLink(canonicalUrl);
  setNamedMeta('description', routeSeo.description);
  setNamedMeta('author', siteSeo.authorName);
  setNamedMeta('robots', routeState.name === 'editor' ? 'noindex, nofollow' : 'index, follow');
  setNamedMeta('theme-color', siteSeo.themeColor);
  setNamedMeta('twitter:card', 'summary_large_image');
  setNamedMeta('twitter:title', routeSeo.title);
  setNamedMeta('twitter:description', routeSeo.description);
  setNamedMeta('twitter:image', imageUrl);

  setPropertyMeta('og:type', 'website');
  setPropertyMeta('og:site_name', siteSeo.siteName);
  setPropertyMeta('og:locale', siteSeo.locale);
  setPropertyMeta('og:title', routeSeo.title);
  setPropertyMeta('og:description', routeSeo.description);
  setPropertyMeta('og:url', canonicalUrl);
  setPropertyMeta('og:image', imageUrl);

  setStructuredData(routeState, routeSeo, canonicalUrl, imageUrl);
}
