// Renders the permanent site shell.
//
// Page content is inserted into #sitePage by siteRouter.ts.
// The virtual gallery overlay stays mounted so it can open from any page.

export function renderSite(app: HTMLElement) {
  app.innerHTML = `
    <div id="sitePage"></div>

    <div class="gallery-overlay" id="galleryOverlay" aria-hidden="true">
      <button class="gallery-close" id="closeGalleryButton" type="button">Exit</button>

      <div class="gallery-control-card" id="galleryControlCard" aria-hidden="true">
        <p class="eyebrow">Controls</p>
        <dl>
          <div>
            <dt>Move</dt>
            <dd>WASD / Arrows</dd>
          </div>
          <div>
            <dt>Look</dt>
            <dd>Mouse</dd>
          </div>
          <div>
            <dt>Exit</dt>
            <dd>Esc</dd>
          </div>
        </dl>
      </div>

      <div class="gallery-crosshair" aria-hidden="true"></div>

      <aside class="gallery-info-panel" id="galleryInfoPanel" aria-live="polite">
        <p class="eyebrow" id="galleryInfoMeta"></p>
        <h2 id="galleryInfoTitle"></h2>
        <p id="galleryInfoNote"></p>
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
