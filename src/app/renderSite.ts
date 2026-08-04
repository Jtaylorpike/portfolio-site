// Renders the permanent site shell.
//
// Page content is inserted into #sitePage by siteRouter.ts.
// The virtual gallery overlay stays mounted so it can open from any page.

import { siteCopy } from '../data/siteCopy';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderSite(app: HTMLElement) {
  app.innerHTML = `
    <div id="sitePage"></div>

    <div class="gallery-overlay" id="galleryOverlay" aria-hidden="true">
      <div class="gallery-toolbar" aria-label="Gallery status and settings">
        <span class="gallery-release-status" data-gallery-release="alpha">${escapeHtml(siteCopy.gallery.releaseStatus)}</span>
        <button class="gallery-diagnostics-toggle" id="galleryDiagnosticsToggle" type="button" aria-controls="galleryDiagnostics" aria-pressed="false">Diagnostics</button>
        <select class="gallery-quality" id="galleryQualitySelect" aria-label="Gallery quality">
          <option value="auto">Quality · Auto</option>
          <option value="low">Quality · Low</option>
          <option value="balanced">Quality · Medium</option>
          <option value="high">Quality · High</option>
        </select>
      </div>
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
          <div>
            <dt>Environment</dt>
            <dd class="gallery-environment-time-control">
              <select id="galleryEnvironmentTimeSelect" aria-label="Preview gallery environment time">
                <option value="auto">Local time</option>
                <option value="dawn">Dawn</option>
                <option value="day">Day</option>
                <option value="dusk">Dusk</option>
                <option value="night">Night</option>
              </select>
              <span data-gallery-diagnostic="environment">--</span>
            </dd>
          </div>
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

      <p class="gallery-experimental-note">${escapeHtml(siteCopy.gallery.persistentNotice)}</p>

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
          <p class="eyebrow">${escapeHtml(siteCopy.gallery.loadingEyebrow)}</p>
          <h2>${escapeHtml(siteCopy.gallery.loadingHeadline)}</h2>
          <p>${escapeHtml(siteCopy.gallery.loadingBody)}</p>
          <p class="gallery-loading-disclaimer">${escapeHtml(siteCopy.gallery.loadingDisclaimer)}</p>
          <p class="gallery-loading-phase" id="galleryLoadingPhase">${escapeHtml(siteCopy.gallery.loadingPhase)}</p>
          <div class="gallery-loading-bar" aria-hidden="true">
            <span></span>
          </div>
        </div>
      </div>

      <div class="gallery-failure" id="galleryFailure" role="alertdialog" aria-modal="true" aria-labelledby="galleryFailureTitle" hidden>
        <div class="gallery-failure-card">
          <p class="eyebrow">${escapeHtml(siteCopy.gallery.unavailableEyebrow)}</p>
          <h2 id="galleryFailureTitle">${escapeHtml(siteCopy.gallery.unavailableHeadline)}</h2>
          <p>${escapeHtml(siteCopy.gallery.unavailableBody)}</p>
          <a class="button primary" href="#/portfolio" data-gallery-failure-portfolio>${escapeHtml(siteCopy.gallery.unavailableAction)}</a>
        </div>
      </div>

      <div class="gallery-canvas" id="galleryCanvas"></div>
    </div>
  `;
}
