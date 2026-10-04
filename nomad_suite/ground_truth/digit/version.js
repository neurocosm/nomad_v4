// NOMAD Central Version & Creator Registry
function getEasternBuildString() {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const parts = formatter.formatToParts(now);
    const getPart = (type) => parts.find(p => p.type === type)?.value || '';
    const mm = getPart('month');
    const dd = getPart('day');
    const yyyy = getPart('year');
    const hh = getPart('hour');
    const min = getPart('minute');
    return `v1.${mm}${dd}${yyyy}.${hh}${min}`;
  } catch (e) {
    return 'v1.10022026.2157';
  }
}

const NOMAD_VERSION_INFO = {
  appName: 'Nomad DIGIT',
  versionNumber: '1.0.0',
  buildVersion: getEasternBuildString(),
  creator: 'BostonyFX',
  instagramHandle: '@neurocosm',
  instagramUrl: 'https://www.instagram.com/neurocosm',
  tagline: 'Kinetic Telemetry, Navigation Avionics & Text HUD for Mobilization',
  get visionaryHtml() {
    return `${this.appName} by <a href="${this.instagramUrl}" target="_blank" rel="noopener noreferrer" style="color:#00f3ff;text-decoration:none;font-weight:600;">${this.creator} (${this.instagramHandle})</a>`;
  },
  get creatorHtml() {
    return `<a href="${this.instagramUrl}" target="_blank" rel="noopener noreferrer" style="color:#00f3ff;text-decoration:none;font-weight:600;">${this.creator}</a>`;
  },
  get footerHtml() {
    return `${this.appName} Navigation Dashboard • Crafted by <a href="${this.instagramUrl}" target="_blank" rel="noopener noreferrer" style="color:#00f3ff;text-decoration:none;font-weight:600;">${this.creator}</a>`;
  }
};

function hydrateNomadMergeTags(rootElement = document) {
  if (typeof document === 'undefined') return;

  rootElement.querySelectorAll('.nomad-brand').forEach(el => {
    el.textContent = NOMAD_VERSION_INFO.appName;
  });
  rootElement.querySelectorAll('.nomad-creator').forEach(el => {
    el.innerHTML = NOMAD_VERSION_INFO.creatorHtml;
  });
  rootElement.querySelectorAll('.nomad-version').forEach(el => {
    el.textContent = NOMAD_VERSION_INFO.buildVersion;
  });
  rootElement.querySelectorAll('.nomad-footer').forEach(el => {
    el.innerHTML = NOMAD_VERSION_INFO.footerHtml;
  });

  const walker = document.createTreeWalker(rootElement.body || rootElement, NodeFilter.SHOW_TEXT, null);
  let node;
  const nodesToUpdate = [];
  while ((node = walker.nextNode())) {
    if (node.nodeValue && node.nodeValue.includes('[merge_')) {
      nodesToUpdate.push(node);
    }
  }

  nodesToUpdate.forEach(n => {
    let text = n.nodeValue;
    if (!text) return;
    text = text.replace(/\[merge_visionary\]/g, `${NOMAD_VERSION_INFO.appName} by ${NOMAD_VERSION_INFO.creator} (${NOMAD_VERSION_INFO.instagramHandle})`);
    text = text.replace(/\[merge_creator\]|\[merge_author\]/g, NOMAD_VERSION_INFO.creator);
    text = text.replace(/\[merge_footer\]/g, `${NOMAD_VERSION_INFO.appName} Navigation Dashboard • Crafted by ${NOMAD_VERSION_INFO.creator}`);
    text = text.replace(/\[merge_version\]/g, NOMAD_VERSION_INFO.buildVersion);
    n.nodeValue = text;
  });
}

if (typeof window !== 'undefined') {
  window.NOMAD_VERSION_INFO = NOMAD_VERSION_INFO;
  window.hydrateNomadMergeTags = hydrateNomadMergeTags;
  window.openNomadAboutModal = () => {
    const modal = document.getElementById('nomad-about-modal');
    if (modal) modal.style.display = 'flex';
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => hydrateNomadMergeTags());
  } else {
    hydrateNomadMergeTags();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NOMAD_VERSION_INFO, hydrateNomadMergeTags };
}
