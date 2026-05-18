// Small hash router for the static site.
//
// Hash routes work on GitHub Pages without server-side routing.

import {
  renderAboutPage,
  renderEntryPage,
  renderHomePage,
  renderPortfolioPage
} from './sitePages';
import { setupSiteInteractions } from './siteInteractionsController';
import { renderImageEditorPage } from './editor/imageEditorPage';
import { setupImageEditorController } from './editor/imageEditorController';
import { applySeoForRoute } from './seoController';
import { isValidCategoryId } from '../data/categories';

type RouteName = 'entry' | 'home' | 'portfolio' | 'about' | 'editor';

type SiteRoute = {
  name: RouteName;
  category: string;
};

const mobileEntryQuery = window.matchMedia(
  '(hover: none), (pointer: coarse), (max-width: 860px)'
);

function getValidPortfolioCategory(category: string | undefined) {
  if (category && isValidCategoryId(category)) {
    return category;
  }

  return 'all';
}

function getRouteFromHash(): SiteRoute {
  const rawRoute = window.location.hash.replace(/^#\/?/, '');
  const routeParts = rawRoute.split('/');
  const route = routeParts[0];

  if (!route) {
    return {
      name: mobileEntryQuery.matches ? 'home' as RouteName : 'entry' as RouteName,
      category: 'all'
    };
  }

  if (route === 'portfolio') {
    return {
      name: 'portfolio' as RouteName,
      category: getValidPortfolioCategory(routeParts[1])
    };
  }

  if (route === 'about') {
    return {
      name: 'about' as RouteName,
      category: 'all'
    };
  }

  if (route === 'home') {
    return {
      name: 'home' as RouteName,
      category: 'all'
    };
  }

  if (route === 'editor' && import.meta.env.DEV) {
    return {
      name: 'editor' as RouteName,
      category: 'all'
    };
  }

  return {
    name: 'home' as RouteName,
    category: 'all'
  };
}

function renderRoute() {
  const sitePage = document.querySelector<HTMLDivElement>('#sitePage');

  if (!sitePage) {
    throw new Error('Site page container was not found.');
  }

  const route = getRouteFromHash();

  applySeoForRoute({
    name: route.name,
    category: route.category
  });

  switch (route.name) {
    case 'entry':
      sitePage.innerHTML = renderEntryPage();
      setupSiteInteractions();
      break;

    case 'portfolio':
      sitePage.innerHTML = renderPortfolioPage(route.category);
      setupSiteInteractions();
      break;

    case 'about':
      sitePage.innerHTML = renderAboutPage();
      setupSiteInteractions();
      break;

    case 'editor':
      sitePage.innerHTML = renderImageEditorPage();
      setupImageEditorController();
      break;

    case 'home':
    default:
      sitePage.innerHTML = renderHomePage();
      setupSiteInteractions();
      break;
  }

  window.scrollTo(0, 0);
}

export function setupSiteRouter() {
  renderRoute();

  window.addEventListener('hashchange', renderRoute);

  mobileEntryQuery.addEventListener('change', () => {
    if (!window.location.hash) {
      renderRoute();
    }
  });
}