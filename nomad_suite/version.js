/**
 * ====================================================================
 * NOMAD HUD & Telemetry Navigation System
 * 
 * Proprietary & Created by BostonyFX
 * All rights reserved.
 * ====================================================================
 */

// NOMAD Central Version Registry
// Edit this single line at the end of a session to update the version across all pages and modals.
window.NOMAD_VERSION = "v4.10102026.0735";

// NOMAD Creator & Visionary Registry (SINGLE FILE OF REFERENCE FOR ALL BRANDING)
window.NOMAD_CREATOR = {
  name: "BostonyFX",
  handle: "",
  url: "https://www.instagram.com/tony_bostony/",
  get brandHTML() {
    return `NOMAD by <a href="${this.url}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">${this.name}</a>`;
  },
  get authorLinkHTML() {
    return `<a href="${this.url}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">${this.name}</a>`;
  },
  get fullFooterHTML() {
    return `NOMAD Navigation Architecture &bull; Crafted by <a href="${this.url}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">${this.name}</a>`;
  }
};

/**
 * Standard About Modal Generator
 * Injects or opens the standard NOMAD About Modal on any sub-page or view.
 */
window.injectNomadAboutModal = function() {
  if (document.getElementById('nomad-about-modal')) return;

  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'nomad-about-modal';
  modalOverlay.className = 'nomad-modal-overlay';
  modalOverlay.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
    display: none; align-items: center; justify-content: center; z-index: 99999; padding: 20px;
  `;
  modalOverlay.onclick = (e) => {
    if (e.target === modalOverlay) window.closeNomadAboutModal();
  };

  modalOverlay.innerHTML = `
    <div style="background: #11141a; border: 1px solid #222b38; border-radius: 16px; max-width: 380px; width: 100%; padding: 24px; text-align: center; color: #e0e6ed; box-shadow: 0 20px 40px rgba(0,0,0,0.8); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <a href="features.html" style="text-decoration: none; color: inherit; display: block;">
        <div style="font-size: 1.3rem; font-weight: 800; letter-spacing: 0.5px; color: #38bdf8; margin-bottom: 2px;">NOMAD: Avionics Suite ↗</div>
        <div style="font-size: 0.75rem; color: #94a3b8; margin-bottom: 12px;">Multi-Personality Avionics &bull; User Guide</div>
      </a>
      <div style="font-size: 0.85rem; color: #cbd5e1; margin-bottom: 16px;">
        by <a href="${window.NOMAD_CREATOR.url}" target="_blank" rel="noopener noreferrer" style="color: #f59e0b; text-decoration: none; font-weight: 600;">${window.NOMAD_CREATOR.name}</a>
      </div>
      <div style="font-size: 0.82rem; color: #94a3b8; line-height: 1.5; margin-bottom: 16px;">
        Real-time telemetry, GPS tracking, and heads-up navigation dashboard.
      </div>
      <div style="font-family: monospace; font-size: 0.75rem; color: #64748b; margin-bottom: 20px;">
        ${window.NOMAD_VERSION}
      </div>
      <button onclick="window.closeNomadAboutModal()" style="background: #1e293b; border: 1px solid #334155; color: #f8fafc; padding: 8px 24px; border-radius: 9999px; font-weight: 600; cursor: pointer; font-size: 0.85rem;">
        Close
      </button>
    </div>
  `;

  document.body.appendChild(modalOverlay);
};

window.openNomadAboutModal = function() {
  if (window.NomadMenuEngine && typeof window.NomadMenuEngine.open === 'function') {
    window.NomadMenuEngine.open();
    return;
  }
  window.injectNomadAboutModal();
  const modal = document.getElementById('nomad-about-modal');
  if (modal) modal.style.display = 'flex';
};

window.closeNomadAboutModal = function() {
  if (window.NomadMenuEngine && typeof window.NomadMenuEngine.close === 'function') {
    window.NomadMenuEngine.close();
    return;
  }
  const modal = document.getElementById('nomad-about-modal');
  if (modal) modal.style.display = 'none';
};

// Automatically load unified menu engine across all pages
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (!document.getElementById('nomad-menu-engine-script')) {
    const menuScript = document.createElement('script');
    menuScript.id = 'nomad-menu-engine-script';
    menuScript.src = (window.location.pathname.includes('/nomad_suite')) ? 'js/nomad-menu.js' : '/js/nomad-menu.js';
    menuScript.async = true;
    document.head.appendChild(menuScript);
  }
}

/**
 * Applies versions, creator branding, and replaces standard merge tags
 */
function applyNomadRegistry() {
  const version = window.NOMAD_VERSION;
  const creator = window.NOMAD_CREATOR;

  // 1. Update version elements
  document.querySelectorAll('.nomad-version, [data-nomad-version]').forEach((el) => {
    el.textContent = version;
  });

  const modalVersion = document.getElementById('nomad-modal-version');
  if (modalVersion) modalVersion.textContent = version;

  const heroModalVer = document.getElementById('nomad-modal-version-hero');
  if (heroModalVer) heroModalVer.textContent = version;

  const hudVersion = document.getElementById('hud-version');
  if (hudVersion) hudVersion.textContent = version;

  const geekFirmware = document.getElementById('geek-system-firmware');
  if (geekFirmware) {
    geekFirmware.textContent = `SYSTEM FIRMWARE: ${version} // VT220-CRT`;
  }

  const featuresVersion = document.getElementById('features-version');
  if (featuresVersion) featuresVersion.textContent = version;

  // 2. Class / Attribute selector creator branding hooks
  document.querySelectorAll('.footer-brand, .nomad-creator, .nomad-author, .nomad-creator-link, [data-nomad-creator]').forEach((el) => {
    el.innerHTML = creator.authorLinkHTML;
  });

  // 3. Remove all handle elements and references
  document.querySelectorAll('.nomad-creator-handle').forEach((el) => {
    el.remove();
  });

  // 4. Scan DOM Text Nodes for Merge Tags and creator handles
  if (document.body) {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
          const parent = node.parentNode;
          if (parent && (parent.nodeName === 'SCRIPT' || parent.nodeName === 'STYLE' || parent.nodeName === 'TEXTAREA')) {
            return NodeFilter.FILTER_REJECT;
          }
          if (
            node.nodeValue.includes('[merge_visionary]') ||
            node.nodeValue.includes('[MERGE_VISIONARY]') ||
            node.nodeValue.includes('[merge_creator]') ||
            node.nodeValue.includes('[merge_author]') ||
            node.nodeValue.includes('[merge_footer]') ||
            node.nodeValue.includes('[merge_version]')
          ) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        }
      },
      false
    );

    const nodesToReplace = [];
    while (walker.nextNode()) {
      nodesToReplace.push(walker.currentNode);
    }

    nodesToReplace.forEach((node) => {
      const parent = node.parentNode;
      if (!parent) return;

      const span = document.createElement('span');
      span.innerHTML = node.nodeValue
        .replace(/\[merge_visionary\]/gi, creator.brandHTML)
        .replace(/\[merge_creator\]/gi, creator.authorLinkHTML)
        .replace(/\[merge_author\]/gi, creator.authorLinkHTML)
        .replace(/\[merge_footer\]/gi, creator.fullFooterHTML)
        .replace(/\[merge_version\]/gi, version);

      parent.replaceChild(span, node);
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyNomadRegistry);
} else {
  applyNomadRegistry();
}
