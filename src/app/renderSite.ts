// Renders the permanent site shell.
//
// Page content is inserted into #sitePage by siteRouter.ts.
// The virtual gallery overlay stays mounted so it can open from any page.

export function renderSite(app: HTMLElement) {
  app.innerHTML = `
    <div id="sitePage"></div>

    <div class="gallery-overlay" id="galleryOverlay" aria-hidden="true">
      <select class="gallery-quality" id="galleryQualitySelect" aria-label="Gallery quality">
        <option value="auto">Quality · Auto</option>
        <option value="low">Quality · Low</option>
        <option value="balanced">Quality · Medium</option>
        <option value="high">Quality · High</option>
      </select>
      <button class="gallery-close" id="closeGalleryButton" type="button" aria-label="Exit virtual gallery">Exit</button>

      <aside class="gallery-diagnostics" id="galleryDiagnostics" aria-label="Local gallery diagnostics" hidden>
        <div class="gallery-diagnostics-header">
          <strong>Local Diagnostics</strong>
          <span>No telemetry</span>
        </div>
        <dl>
          <div><dt>Quality</dt><dd data-gallery-diagnostic="quality">--</dd></div>
          <div><dt>Readiness</dt><dd data-gallery-diagnostic="readiness">--</dd></div>
          <div><dt>Cadence</dt><dd data-gallery-diagnostic="cadence">--</dd></div>
          <div><dt>Work</dt><dd data-gallery-diagnostic="work">--</dd></div>
          <div><dt>Pixel ratio</dt><dd data-gallery-diagnostic="pixel-ratio">--</dd></div>
          <div><dt>Renderer</dt><dd data-gallery-diagnostic="renderer">--</dd></div>
          <div><dt>Scene</dt><dd data-gallery-diagnostic="scene">--</dd></div>
          <div><dt>Device hints</dt><dd data-gallery-diagnostic="device">--</dd></div>
        </dl>
      </aside>

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

      <div class="gallery-touch-controls" id="galleryTouchControls" aria-hidden="true">
        <div class="gallery-touch-look-hint" aria-hidden="true">Drag to look · left thumb to move</div>
        <div class="gallery-touch-move" id="galleryTouchMove" aria-label="Touch movement control for the virtual gallery" role="application">
          <span class="gallery-touch-move-label">Move</span>
          <span class="gallery-touch-move-base" aria-hidden="true">
            <span class="gallery-touch-move-knob" id="galleryTouchMoveKnob"></span>
          </span>
        </div>
      </div>

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
          <p class="gallery-loading-phase" id="galleryLoadingPhase">Preparing image textures</p>
          <div class="gallery-loading-bar" aria-hidden="true">
            <span></span>
          </div>
        </div>
      </div>

      <div class="gallery-canvas" id="galleryCanvas"></div>
    </div>
  `;
}
