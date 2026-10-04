/**
 * ====================================================================
 * NOMAD HUD & Telemetry Navigation System
 * 
 * Proprietary & Created by BostonyFX
 * Instagram: https://instagram.com/neurocosm
 * All rights reserved.
 * ====================================================================
 */

// NOMAD Central Version Registry
// Edit this single line at the end of a session to update the version across all pages and modals.
window.NOMAD_VERSION = "v3.09152026.2041";

// NOMAD Creator & Visionary Registry
window.NOMAD_CREATOR = {
  name: "BostonyFX",
  handle: "@neurocosm",
  url: "https://instagram.com/neurocosm",
  get brandHTML() {
    return `NOMAD: RoadTrip by <a href="${this.url}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">BostonyFX</a>`;
  },
  get authorLinkHTML() {
    return `<a href="${this.url}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">BostonyFX</a>`;
  },
  get fullFooterHTML() {
    return `NOMAD: RoadTrip Navigation Dashboard &bull; Crafted by <a href="${this.url}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">BostonyFX</a>`;
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
        <div style="font-size: 1.3rem; font-weight: 800; letter-spacing: 0.5px; color: #38bdf8; margin-bottom: 2px;">NOMAD: RoadTrip ↗</div>
        <div style="font-size: 0.75rem; color: #94a3b8; margin-bottom: 12px;">Features &amp; User Guide</div>
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
  window.injectNomadAboutModal();
  const modal = document.getElementById('nomad-about-modal');
  if (modal) modal.style.display = 'flex';
};

window.closeNomadAboutModal = function() {
  const modal = document.getElementById('nomad-about-modal');
  if (modal) modal.style.display = 'none';
};

/**
 * Applies versions, creator branding, and replaces standard merge tags
 * such as [merge_visionary], [merge_creator], [merge_author], [merge_version], [merge_footer]
 */
function applyNomadRegistry() {
  const version = window.NOMAD_VERSION || "v3.0";
  const creator = window.NOMAD_CREATOR;

  // 1. Update version elements
  document.querySelectorAll('.nomad-version, [data-nomad-version]').forEach((el) => {
    el.textContent = version;
  });

  const modalVersion = document.getElementById('nomad-modal-version');
  if (modalVersion) modalVersion.textContent = version;

  const geekFirmware = document.getElementById('geek-system-firmware');
  if (geekFirmware) {
    geekFirmware.textContent = `SYSTEM FIRMWARE: ${version} // VT220-CRT`;
  }

  const featuresVersion = document.getElementById('features-version');
  if (featuresVersion) featuresVersion.textContent = version;

  // 2. Class / Attribute selector branding hooks
  document.querySelectorAll('.nomad-brand, [data-nomad-brand]').forEach((el) => {
    el.innerHTML = creator.brandHTML;
  });

  document.querySelectorAll('.nomad-creator, .nomad-author, [data-nomad-creator]').forEach((el) => {
    el.innerHTML = creator.authorLinkHTML;
  });

  document.querySelectorAll('.nomad-footer, [data-nomad-footer]').forEach((el) => {
    el.innerHTML = creator.fullFooterHTML;
  });

  // 3. Scan DOM Text Nodes for Merge Tags:
  // [merge_visionary], [merge_creator], [merge_author], [merge_version], [merge_footer]
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
