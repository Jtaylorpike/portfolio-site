// Main site entry file.
//
// This file loads the CSS, renders the site shell, starts the page router,
// and connects the virtual gallery controller.

import './styles/global.css';
import { renderSite } from './app/renderSite';
import { setupGalleryController } from './app/galleryController';
import { setupSiteRouter } from './app/siteRouter';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('App root was not found.');
}

renderSite(app);
setupGalleryController();
setupSiteRouter();