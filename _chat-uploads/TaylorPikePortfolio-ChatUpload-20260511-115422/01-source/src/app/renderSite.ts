// Renders the permanent site shell.
//
// Page content is inserted into #sitePage by siteRouter.ts.
// The virtual gallery overlay stays mounted so it can open from any page.

export function renderSite(app: HTMLElement) {
  app.innerHTML = `
    <div id="sitePage"></div>

    <div class="gallery-overlay" id="galleryOverlay" aria-hidden="true">
      <div class="gallery-ui">
        <div>
          <p class="eyebrow">Virtual Gallery</p>
          <p class="gallery-instructions">
            Click inside the gallery, then use WASD or arrow keys to move. Move your mouse to look around. Look directly at a photo to see details. Press Escape to exit.
          </p>
        </div>

        <button class="gallery-close" id="closeGalleryButton" type="button">Exit</button>
      </div>

      <div class="gallery-crosshair" aria-hidden="true"></div>

      <aside class="gallery-info-panel" id="galleryInfoPanel" aria-live="polite">
        <p class="eyebrow" id="galleryInfoMeta">Selected work</p>
        <h2 id="galleryInfoTitle">Look at a photo</h2>
        <p id="galleryInfoNote">Artwork details will appear here when you look directly at one of the images.</p>
      </aside>

      <div class="gallery-loading" id="galleryLoading" aria-live="polite">
        <div class="gallery-loading-card">
          <p class="eyebrow">Loading Gallery</p>
          <h2>Preparing the room</h2>
          <p>Images are loading before the gallery opens so the first movement feels smoother.</p>
          <div class="gallery-loading-bar" aria-hidden="true">
            <span></span>
          </div>
        </div>
      </div>

      <div class="gallery-canvas" id="galleryCanvas"></div>
    </div>
  `;
}