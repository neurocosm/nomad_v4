/**
 * ====================================================================
 * NOMAD: UNIFIED MENU & SETTINGS ENGINE
 * Single Source of Truth for About, Switch Cockpit, Utilities & Credits
 * 
 * Proprietary & Created by BostonyFX
 * File: /js/nomad-menu.js
 * ====================================================================
 */

(function(root) {
  'use strict';

  // Determine current cockpit context from URL path or body dataset
  function getCockpitContext() {
    if (document.body && document.body.dataset && document.body.dataset.cockpit) {
      return document.body.dataset.cockpit;
    }
    const path = (window.location.pathname || '').toLowerCase();
    const search = (window.location.search || '').toLowerCase();
    if (path.includes('digit') || search.includes('digit') || document.querySelector('.digit-layout, #block-philosophy, #clock-time, #digit-app')) {
      return 'digit';
    }
    if (path.includes('roadtrip') || search.includes('roadtrip')) {
      return 'roadtrip';
    }
    if (path.includes('hyperspace') || search.includes('hyperspace')) {
      return 'hyperspace';
    }
    if (path.includes('nomad_suite') || path.endsWith('/') || path.endsWith('index.html')) {
      // Check if root index is acting as hyperspace or launcher
      if (document.getElementById('speed-bubble') || document.getElementById('map-card')) {
        return 'hyperspace';
      }
      return 'launcher';
    }
    return 'launcher';
  }

  const COCKPIT_META = {
    hyperspace: {
      name: 'NOMAD: Hyperspace',
      badge: 'Kinetic Telemetry • User Guide & Features',
      guideAnchor: 'features.html#hyperspace',
      accentColor: '#ff0055',
      desc: 'Kinetic vector canvas with floating telemetry.'
    },
    roadtrip: {
      name: 'NOMAD: RoadTrip',
      badge: 'Highway Panoramic • User Guide & Features',
      guideAnchor: 'features.html#roadtrip',
      accentColor: '#00f3ff',
      desc: 'High-contrast street level mapping accuracy.'
    },
    digit: {
      name: 'NOMAD: DIGIT',
      badge: 'Tactical Monospace Telemetry Matrix',
      guideAnchor: 'features.html#digit',
      accentColor: '#30d158',
      desc: 'Military monospace ASCII matrix &amp; high-density telemetry.'
    },
    launcher: {
      name: 'NOMAD: Avionics Suite',
      badge: 'Launch Control Home',
      guideAnchor: 'features.html',
      accentColor: '#00f3ff',
      desc: 'Central mission control for the 3 distinct NOMAD cockpits and shared sensory visualizers.'
    }
  };

  // Inject unified CSS stylesheet once
  function ensureMenuStyles() {
    if (document.getElementById('nomad-menu-unified-style')) return;
    const style = document.createElement('style');
    style.id = 'nomad-menu-unified-style';
    style.textContent = `
      #about-modal.nomad-unified-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        height: 100dvh;
        background: rgba(5, 8, 17, 0.88);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.22s ease;
        padding: 16px;
        box-sizing: border-box;
      }
      #about-modal.nomad-unified-modal.active {
        opacity: 1;
        pointer-events: auto;
      }
      #about-modal .nomad-modal-box {
        background: #121826;
        border: 1.5px solid rgba(0, 243, 255, 0.35);
        border-radius: 18px;
        padding: 22px 20px;
        width: 100%;
        max-width: 410px;
        max-height: 88vh;
        max-height: 88dvh;
        overflow-y: auto;
        text-align: center;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.85), 0 0 24px rgba(0, 243, 255, 0.18);
        transform: scale(0.94);
        transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
        -webkit-overflow-scrolling: touch;
        display: flex;
        flex-direction: column;
        gap: 10px;
        box-sizing: border-box;
      }
      #about-modal.active .nomad-modal-box {
        transform: scale(1);
      }
      #about-modal .modal-title-link {
        text-decoration: none;
        color: inherit;
        display: block;
        margin-bottom: 2px;
      }
      #about-modal .modal-title {
        font-size: 1.25rem;
        font-weight: 800;
        color: #38bdf8;
        letter-spacing: 0.5px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      #about-modal .modal-features-hint {
        font-size: 0.72rem;
        color: #94a3b8;
        font-family: 'JetBrains Mono', monospace;
        letter-spacing: 0.04em;
        margin-top: 2px;
      }
      #about-modal .modal-author {
        font-size: 0.82rem;
        color: #cbd5e1;
        font-family: 'JetBrains Mono', monospace;
      }
      #about-modal .modal-author a {
        color: #f59e0b;
        text-decoration: underline;
        font-weight: 700;
      }
      #about-modal .modal-body {
        font-size: 0.78rem;
        color: #94a3b8;
        line-height: 1.45;
        text-align: left;
        background: rgba(0, 0, 0, 0.35);
        padding: 9px 12px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      #about-modal .modal-cockpit-section {
        background: rgba(15, 23, 42, 0.60);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        padding: 9px;
        display: flex;
        flex-direction: column;
        gap: 7px;
      }
      #about-modal .modal-cockpit-header {
        font-size: 0.64rem;
        font-weight: 700;
        color: #64748b;
        letter-spacing: 0.08em;
        font-family: 'JetBrains Mono', monospace;
      }
      #about-modal .modal-cockpit-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 6px;
      }
      #about-modal .modal-cockpit-btn {
        padding: 7px 4px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.10);
        border-radius: 8px;
        color: #94a3b8;
        font-size: 0.68rem;
        font-weight: 700;
        text-decoration: none;
        font-family: 'JetBrains Mono', monospace;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;
      }
      #about-modal .modal-cockpit-btn.is-active {
        background: rgba(0, 243, 255, 0.12);
        border-color: #00f3ff;
        color: #00f3ff;
        box-shadow: 0 0 10px rgba(0, 243, 255, 0.25);
      }
      #about-modal .modal-cockpit-btn.is-active.btn-hyperspace {
        background: rgba(255, 0, 85, 0.14);
        border-color: #ff0055;
        color: #ff0055;
        box-shadow: 0 0 12px rgba(255, 0, 85, 0.35);
      }
      #about-modal .modal-cockpit-btn.is-active.btn-roadtrip {
        background: rgba(0, 243, 255, 0.14);
        border-color: #00f3ff;
        color: #00f3ff;
        box-shadow: 0 0 12px rgba(0, 243, 255, 0.30);
      }
      #about-modal .modal-cockpit-btn.is-active.btn-digit {
        background: rgba(48, 209, 88, 0.14);
        border-color: #30d158;
        color: #30d158;
        box-shadow: 0 0 12px rgba(48, 209, 88, 0.30);
      }
      #about-modal .modal-home-launcher-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        width: 100%;
        padding: 8px 10px;
        background: linear-gradient(90deg, rgba(0, 243, 255, 0.10), rgba(255, 183, 3, 0.10));
        border: 1px solid rgba(0, 243, 255, 0.35);
        border-radius: 8px;
        color: #f8fafc;
        font-size: 0.72rem;
        font-weight: 700;
        font-family: 'JetBrains Mono', monospace;
        letter-spacing: 0.04em;
        text-decoration: none;
        transition: all 0.15s ease;
        box-sizing: border-box;
      }
      #about-modal .modal-home-launcher-btn:hover {
        background: linear-gradient(90deg, rgba(0, 243, 255, 0.22), rgba(255, 183, 3, 0.22));
        border-color: #00f3ff;
        color: #ffffff;
        box-shadow: 0 0 12px rgba(0, 243, 255, 0.25);
      }
      #about-modal .modal-default-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        font-size: 0.66rem;
        color: #94a3b8;
        cursor: pointer;
        font-family: 'JetBrains Mono', monospace;
      }
      #about-modal .modal-action-stack {
        display: flex;
        flex-direction: column;
        gap: 7px;
      }
      #about-modal .modal-btn-row {
        display: block;
        width: 100%;
        padding: 9px 12px;
        border-radius: 10px;
        font-size: 0.78rem;
        font-weight: 800;
        font-family: 'JetBrains Mono', monospace;
        text-decoration: none;
        text-align: center;
        cursor: pointer;
        box-sizing: border-box;
        transition: all 0.15s ease;
      }
      #about-modal .modal-vis-btn {
        background: linear-gradient(90deg, rgba(255, 0, 127, 0.18), rgba(0, 212, 255, 0.18));
        border: 1.5px solid #ff007f;
        color: #ffffff;
      }
      #about-modal .modal-stats-btn {
        background: rgba(255, 176, 0, 0.10);
        border: 1.5px solid #ffb000;
        color: #ffb000;
      }
      #about-modal .modal-guide-btn {
        background: rgba(56, 189, 248, 0.10);
        border: 1.5px solid #38bdf8;
        color: #38bdf8;
      }
      #about-modal .modal-audio-btn {
        background: rgba(0, 243, 255, 0.08);
        border: 1.5px solid #00f3ff;
        color: #ffffff;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      #about-modal .modal-download-btn {
        background: #10b981;
        border: none;
        color: #000000;
        font-weight: 800;
      }
      #about-modal .modal-purge-btn {
        background: rgba(255, 0, 79, 0.12);
        border: 1.5px solid #ff004f;
        color: #ff004f;
      }
      #about-modal .modal-close-btn {
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #94a3b8;
        padding: 7px 22px;
        border-radius: 8px;
        font-size: 0.78rem;
        font-family: 'JetBrains Mono', monospace;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      #about-modal .modal-close-btn:hover {
        border-color: #ffffff;
        color: #ffffff;
      }
      #about-modal .modal-bottom-version {
        font-size: 0.65rem;
        font-family: 'JetBrains Mono', monospace;
        color: #00d4ff;
        margin-top: 2px;
        letter-spacing: 0.06em;
      }
    `;
    document.head.appendChild(style);
  }

  // Generate and render the unified modal HTML
  function renderUnifiedMenuHTML() {
    const context = getCockpitContext();
    const meta = COCKPIT_META[context] || COCKPIT_META.launcher;
    const creator = window.NOMAD_CREATOR || {
      name: 'BostonyFX',
      url: 'https://www.instagram.com/tony_bostony/'
    };
    const version = window.NOMAD_VERSION || 'v4.10072026.2006';

    let overlay = document.getElementById('about-modal');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'about-modal';
      document.body.appendChild(overlay);
    }
    overlay.className = 'modal-overlay nomad-unified-modal';
    overlay.onclick = function(e) {
      if (e.target === overlay) window.closeAboutModal(e);
    };

    // Cockpit Switcher Section (shown in active cockpits)
    const isCockpit = (context !== 'launcher');
    const defaultBoot = localStorage.getItem('nomad_default_cockpit') || 'hyperspace';
    const isDefault = (defaultBoot === context);

    let switcherHTML = '';
    if (isCockpit) {
      switcherHTML = `
        <div class="modal-cockpit-section">
          <div class="modal-cockpit-header">COCKPITS &amp; LAUNCH CONTROL</div>
          <div class="modal-cockpit-grid">
            <a href="hyperspace.html" class="modal-cockpit-btn btn-hyperspace ${context === 'hyperspace' ? 'is-active' : ''}">
              🚀 HYPERSPACE
            </a>
            <a href="roadtrip.html" class="modal-cockpit-btn btn-roadtrip ${context === 'roadtrip' ? 'is-active' : ''}">
              🚗 ROAD TRIP
            </a>
            <a href="digit.html" class="modal-cockpit-btn btn-digit ${context === 'digit' ? 'is-active' : ''}">
              📟 DIGIT
            </a>
          </div>
          <a href="index.html" class="modal-home-launcher-btn" title="Return to Launch Control Home">
            <span>🛰️ LAUNCH CONTROL (HOME) ↗</span>
          </a>
          <div class="modal-default-cockpit-wrap">
            <label class="modal-default-toggle">
              <input type="checkbox" id="chk-default-cockpit" ${isDefault ? 'checked' : ''} onchange="window.toggleUnifiedDefaultBoot('${context}')" />
              <span>★ Set ${meta.name.replace('NOMAD: ', '')} as Default Boot Cockpit</span>
            </label>
          </div>
        </div>
      `;
    } else {
      switcherHTML = `
        <div class="modal-cockpit-section">
          <div class="modal-cockpit-header">SELECT COCKPIT TO LAUNCH</div>
          <div class="modal-cockpit-grid">
            <a href="hyperspace.html" class="modal-cockpit-btn btn-hyperspace">
              🚀 HYPERSPACE
            </a>
            <a href="roadtrip.html" class="modal-cockpit-btn btn-roadtrip">
              🚗 ROAD TRIP
            </a>
            <a href="digit.html" class="modal-cockpit-btn btn-digit">
              📟 DIGIT
            </a>
          </div>
        </div>
      `;
    }

    // Audio toggle row for DIGIT
    let audioHTML = '';
    if (context === 'digit') {
      const isSoundOn = (window.digitSoundEnabled !== false);
      audioHTML = `
        <button id="btn-audio-modal" class="modal-btn-row modal-audio-btn" onclick="window.toggleUnifiedAudio()" title="Toggle Avionics Audio">
          <span>🔊 AVIONICS AUDIO</span>
          <span id="audio-modal-status" style="font-weight: 800; color: #00f3ff;">${isSoundOn ? 'ON' : 'OFF'}</span>
        </button>
      `;
    }

    // Documentation button for Launcher
    let guideBtnHTML = '';
    if (!isCockpit) {
      guideBtnHTML = `
        <a href="features.html" class="modal-btn-row modal-guide-btn">📖 USER GUIDE &amp; FEATURES ↗</a>
      `;
    }

    overlay.innerHTML = `
      <div class="nomad-modal-box" onclick="event.stopPropagation()">
        <!-- Top Link to Documentation -->
        <a href="${meta.guideAnchor}" class="modal-title-link" title="View Features &amp; Guide">
          <div class="modal-title" style="color: ${meta.accentColor};">${meta.name} ↗</div>
          <div class="modal-features-hint">${meta.badge}</div>
        </a>

        <!-- Unified Creator Credit -->
        <div class="modal-author">
          by <a href="${creator.url || 'https://www.instagram.com/tony_bostony/'}" target="_blank" rel="noopener noreferrer" style="color: #f59e0b; font-weight: 700; text-decoration: none;">${creator.name}</a>
        </div>

        <!-- Cockpit Description -->
        <div class="modal-body">
          ${meta.desc}
        </div>

        <!-- Optional Cockpit Switcher -->
        ${switcherHTML}

        <!-- Action Buttons Stack -->
        <div class="modal-action-stack">
          ${audioHTML}
          <a href="visualizer.html?from=${context}" class="modal-btn-row modal-vis-btn">✨ VISUALIZER ARCADE ↗</a>
          <a href="geek-stats.html?from=${context}" class="modal-btn-row modal-stats-btn">&gt; GEEK STATS (VT220) _</a>
          ${guideBtnHTML}
          <a href="/api/download-zip" download="nomad_suite.zip" class="modal-btn-row modal-download-btn">📦 DOWNLOAD ALL FILES (.ZIP)</a>
          <button type="button" class="modal-btn-row modal-purge-btn" onclick="window.executeUnifiedPurge()">⚠️ PURGE CACHE &amp; HARD RELOAD</button>
        </div>

        <!-- Close Action -->
        <div style="margin-top: 4px;">
          <button type="button" class="modal-close-btn" onclick="window.closeAboutModal(event)">Close</button>
        </div>

        <!-- Single Version Tag at Bottom of Card -->
        <div class="modal-bottom-version nomad-version" id="nomad-modal-version">
          ${version}
        </div>
      </div>
    `;
  }

  // Toggle default boot cockpit
  window.toggleUnifiedDefaultBoot = function(cockpitId) {
    const chk = document.getElementById('chk-default-cockpit');
    const isChecked = chk && chk.checked;
    const target = isChecked ? cockpitId : 'hyperspace';
    localStorage.setItem('nomad_default_cockpit', target);
    if (window.NomadCockpitEngine && typeof window.NomadCockpitEngine.setDefaultCockpitId === 'function') {
      window.NomadCockpitEngine.setDefaultCockpitId(target);
    }
    if (typeof window.showToast === 'function') {
      window.showToast(isChecked ? `★ ${cockpitId.toUpperCase()} SET AS DEFAULT BOOT` : `★ DEFAULT BOOT RESET`);
    }
  };

  // Toggle audio in DIGIT
  window.toggleUnifiedAudio = function() {
    window.digitSoundEnabled = !(window.digitSoundEnabled !== false);
    const label = document.getElementById('audio-modal-status');
    if (label) {
      label.textContent = window.digitSoundEnabled ? 'ON' : 'OFF';
      label.style.color = window.digitSoundEnabled ? '#00f3ff' : '#64748b';
    }
    if (typeof window.handleAudioClick === 'function') {
      // Trigger digit internal state
      window.handleAudioClick();
    }
    if (typeof window.showToast === 'function') {
      window.showToast(window.digitSoundEnabled ? 'AVIONICS AUDIO: ON' : 'AVIONICS AUDIO: OFF');
    }
  };

  // Deep purge & hard reload
  window.executeUnifiedPurge = function() {
    if (typeof window.showToast === 'function') {
      window.showToast('⚠️ PURGING ALL CACHES & REFETCHING SOURCE...');
    }
    setTimeout(async () => {
      try {
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          for (const reg of regs) {
            if (reg.active) reg.active.postMessage({ type: 'FORCE_PURGE' });
            await reg.unregister();
          }
        }
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
        }
        // Preserve critical flight and collision detection telemetry database
        const savedBlackbox = localStorage.getItem('nomad_blackbox_log');
        localStorage.clear();
        sessionStorage.clear();
        if (savedBlackbox) {
          localStorage.setItem('nomad_blackbox_log', savedBlackbox);
        }
      } catch (err) {
        console.warn('Purge notice:', err);
      }
      const dest = new URL(window.location.origin + window.location.pathname);
      dest.searchParams.set('purge', Date.now().toString());
      window.location.replace(dest.toString());
    }, 400);
  };

  // Open modal
  window.openAboutModal = function() {
    ensureMenuStyles();
    renderUnifiedMenuHTML();
    const modal = document.getElementById('about-modal');
    if (modal) {
      modal.classList.add('active');
    }
  };

  // Close modal
  window.closeAboutModal = function(e) {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    const modal = document.getElementById('about-modal');
    if (modal) {
      modal.classList.remove('active');
    }
  };

  // Escape key listener
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      window.closeAboutModal();
    }
  });

  // Export
  root.NomadMenuEngine = {
    open: window.openAboutModal,
    close: window.closeAboutModal,
    render: renderUnifiedMenuHTML
  };

})(window);
