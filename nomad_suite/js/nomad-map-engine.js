/**
 * ====================================================================
 * NOMAD: SUITE — DUAL VECTOR MAP THEMES & WEBGL PIPELINE
 * Natural Dark Navigation & Natural Light Navigation Stylesheets,
 * Zero-Reload Style Diffing, GPU Memory Tile Preservation &
 * AASHTO/MUTCD Highway Route Shield Engine
 * 
 * Visionary & Creator: BostonyFX
 * Architecture: Pure Decoupled Event-Driven Provider ("Sensory Core")
 * File: /nomad_suite/js/nomad-map-engine.js
 * ====================================================================
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NomadMapEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // --- Theme Definitions ---
  const THEMES = [
    {
      id: 'natural-dark',
      name: 'Natural Dark Navigation',
      darkSign: true,
      isLight: false,
      accentColor: '#00f3ff',
      tagline: 'Midnight canvas, glowing white road outlines, electric cyan waterways & deep emerald pine'
    },
    {
      id: 'natural-light',
      name: 'Natural Light Navigation',
      darkSign: false,
      isLight: true,
      accentColor: '#007aff',
      tagline: 'Crisp white pavement, vibrant sky-blue waterways, mint green parks & soft slate buildings'
    }
  ];

  // --- In-Memory Style Cache (Guarantees Zero-Reload Instant Toggling) ---
  let cachedDarkStyle = null;
  let cachedLightStyle = null;
  let activeThemeId = 'natural-dark';

  try {
    const saved = localStorage.getItem('nomad_map_theme_id');
    if (saved === 'natural-dark' || saved === 'natural-light') {
      activeThemeId = saved;
    }
  } catch (e) {}

  // Subscribers
  const themeSubscribers = [];
  const shieldSubscribers = [];
  const perspectiveSubscribers = [];

  // 3-Perspective Camera Engine
  const PERSPECTIVE_MODES = [
    {
      id: 'perspective',
      name: '3D Perspective Drive',
      pitch: 58,
      isHeadingUp: true,
      vehicleTilt: 42,
      vehicleTop: '66%',
      topPaddingRatio: 0.36,
      badgeLabel: '3D DRIVE (58°)'
    },
    {
      id: 'overview',
      name: '2D Overview Track',
      pitch: 0,
      isHeadingUp: true,
      vehicleTilt: 0,
      vehicleTop: '50%',
      topPaddingRatio: 0,
      badgeLabel: '2D TRACK-UP (0°)'
    },
    {
      id: 'north-up',
      name: '2D North-Up Locked',
      pitch: 0,
      isHeadingUp: false,
      vehicleTilt: 0,
      vehicleTop: '50%',
      topPaddingRatio: 0,
      badgeLabel: '2D NORTH-UP (LOCKED)'
    }
  ];

  let activePerspectiveMode = 'perspective';
  try {
    const savedPersp = localStorage.getItem('nomad_perspective_mode');
    if (savedPersp === 'perspective' || savedPersp === 'overview' || savedPersp === 'north-up') {
      activePerspectiveMode = savedPersp;
    }
  } catch (e) {}

  // Active shields from telemetry
  let activeInterstateShield = null;
  let activeRouteShield = null;
  let activeSecondaryRouteShield = null;
  let activeHighwayDirection = '';

  // Dual route flipper
  let dualRouteFlipIndex = 0;
  let dualRouteIntervalId = null;

  // --- Base Vector Style Transformer ---

  async function fetchBaseLibertyStyle() {
    const res = await fetch('https://tiles.openfreemap.org/styles/liberty');
    if (!res.ok) throw new Error('Failed to load base vector style: ' + res.status);
    return await res.json();
  }

  function transformToNaturalDark(rawStyle) {
    const s = JSON.parse(JSON.stringify(rawStyle));
    if (!Array.isArray(s.layers)) return s;

    s.layers.forEach(l => {
      if (!l.paint) l.paint = {};

      // 1. Background
      if (l.type === 'background') {
        l.paint['background-color'] = '#070b14';
      }

      // 2. Shaded relief hillshade raster
      if (l.type === 'raster') {
        l.paint['raster-opacity'] = 0.05;
      }

      // 3. Deep midnight water bodies
      if (l.type === 'fill' && (l['source-layer'] === 'water' || l.id === 'water')) {
        l.paint['fill-color'] = '#0a2238';
        l.paint['fill-opacity'] = 0.95;
      }

      // 4. Luminous electric cyan river/stream veins
      if (l.type === 'line' && (l['source-layer'] === 'waterway' || (l.id && l.id.includes('waterway')))) {
        l.paint['line-color'] = '#00d4ff';
        if (!l.paint['line-width']) l.paint['line-width'] = 2.5;
      }

      // 5. Deep pine emerald green nature reserves & forests
      if (l.type === 'fill' && (
        (l.id && (l.id.includes('park') || l.id.includes('wood') || l.id.includes('grass'))) ||
        l['source-layer'] === 'park' || l['source-layer'] === 'landcover'
      )) {
        l.paint['fill-color'] = '#073b22';
        l.paint['fill-opacity'] = 0.85;
        if (l.paint['fill-outline-color']) l.paint['fill-outline-color'] = '#0d5c36';
      }
      if (l.type === 'line' && l.id === 'park_outline') {
        l.paint['line-color'] = '#0d5c36';
      }

      // 6. High-visibility glowing white road outline casings
      if (l.type === 'line' && l.id && l.id.includes('casing')) {
        l.paint['line-color'] = '#f8fafc';
        if (l.paint['line-opacity'] !== undefined) l.paint['line-opacity'] = 1;
      }

      // 7. Dark charcoal-navy road bed fills
      if (l.type === 'line' && l['source-layer'] === 'transportation' && l.id && !l.id.includes('casing')) {
        l.paint['line-color'] = '#0f172a';
      }

      // 8. Midnight slate-navy buildings with crisp borders
      if (l.type === 'fill' && l.id === 'building') {
        l.paint['fill-color'] = '#182436';
        l.paint['fill-outline-color'] = '#334155';
      }
      if (l.type === 'fill-extrusion' && l.id === 'building-3d') {
        l.paint['fill-extrusion-color'] = '#182436';
        l.paint['fill-extrusion-opacity'] = 0.85;
      }

      // 9. Street Names & Road Labels (High-legibility enlarged lettering with bold halos)
      if (l.type === 'symbol' && l['source-layer'] === 'transportation_name' && l.layout && l.layout['text-field']) {
        if (!l.layout) l.layout = {};
        l.layout['text-size'] = [
          'interpolate', ['linear'], ['zoom'],
          12, 12,
          14, 15,
          16, 17,
          18, 20
        ];
        l.paint['text-color'] = '#f8fafc';
        l.paint['text-halo-color'] = '#030712';
        l.paint['text-halo-width'] = 2.5;
        l.paint['text-halo-blur'] = 0.5;
      } else if (l.type === 'symbol' && l.paint) {
        if (l.paint['text-color'] !== undefined) l.paint['text-color'] = '#cbd5e1';
        if (l.paint['text-halo-color'] !== undefined) l.paint['text-halo-color'] = '#070b14';
      }
    });

    return s;
  }

  function transformToNaturalLight(rawStyle) {
    const s = JSON.parse(JSON.stringify(rawStyle));
    if (!Array.isArray(s.layers)) return s;

    s.layers.forEach(l => {
      if (!l.paint) l.paint = {};

      // 1. Background
      if (l.type === 'background') {
        l.paint['background-color'] = '#f1f5f9';
      }

      // 2. Shaded relief raster
      if (l.type === 'raster') {
        l.paint['raster-opacity'] = 0.2;
      }

      // 3. Vibrant sky-blue water bodies
      if (l.type === 'fill' && (l['source-layer'] === 'water' || l.id === 'water')) {
        l.paint['fill-color'] = '#7dd3fc';
        l.paint['fill-opacity'] = 0.95;
      }

      // 4. Clear sky-blue river streams
      if (l.type === 'line' && (l['source-layer'] === 'waterway' || (l.id && l.id.includes('waterway')))) {
        l.paint['line-color'] = '#38bdf8';
        if (!l.paint['line-width']) l.paint['line-width'] = 2.5;
      }

      // 5. Lush spring mint green parks, forests, and nature reserves
      if (l.type === 'fill' && (
        (l.id && (l.id.includes('park') || l.id.includes('wood') || l.id.includes('grass'))) ||
        l['source-layer'] === 'park' || l['source-layer'] === 'landcover'
      )) {
        l.paint['fill-color'] = '#bbf7d0';
        l.paint['fill-opacity'] = 0.85;
        if (l.paint['fill-outline-color']) l.paint['fill-outline-color'] = '#86efac';
      }
      if (l.type === 'line' && l.id === 'park_outline') {
        l.paint['line-color'] = '#86efac';
      }

      // 6. Clean road border casings
      if (l.type === 'line' && l.id && l.id.includes('casing')) {
        l.paint['line-color'] = '#cbd5e1';
      }

      // 7. Crisp white road pavement surfaces
      if (l.type === 'line' && l['source-layer'] === 'transportation' && l.id && !l.id.includes('casing')) {
        l.paint['line-color'] = '#ffffff';
      }

      // 8. Soft slate-blue buildings
      if (l.type === 'fill' && l.id === 'building') {
        l.paint['fill-color'] = '#c4ccd8';
        l.paint['fill-outline-color'] = '#94a3b8';
      }
      if (l.type === 'fill-extrusion' && l.id === 'building-3d') {
        l.paint['fill-extrusion-color'] = '#c4ccd8';
        l.paint['fill-extrusion-opacity'] = 0.85;
      }

      // 9. Street Names & Road Labels
      if (l.type === 'symbol' && l['source-layer'] === 'transportation_name' && l.layout && l.layout['text-field']) {
        if (!l.layout) l.layout = {};
        l.layout['text-size'] = [
          'interpolate', ['linear'], ['zoom'],
          12, 12,
          14, 15,
          16, 17,
          18, 20
        ];
        l.paint['text-color'] = '#0f172a';
        l.paint['text-halo-color'] = '#ffffff';
        l.paint['text-halo-width'] = 2.5;
        l.paint['text-halo-blur'] = 0.5;
      } else if (l.type === 'symbol' && l.paint) {
        if (l.paint['text-color'] !== undefined) l.paint['text-color'] = '#1e293b';
        if (l.paint['text-halo-color'] !== undefined) l.paint['text-halo-color'] = '#ffffff';
      }
    });

    return s;
  }

  // --- Public Style Loader ---

  async function getStyleObject(themeId = activeThemeId) {
    if (themeId === 'natural-light') {
      if (cachedLightStyle) return cachedLightStyle;
      try {
        const raw = await fetchBaseLibertyStyle();
        cachedLightStyle = transformToNaturalLight(raw);
        return cachedLightStyle;
      } catch (err) {
        console.warn('NomadMapEngine: Falling back to OpenFreeMap Bright style', err);
        return 'https://tiles.openfreemap.org/styles/bright';
      }
    } else {
      if (cachedDarkStyle) return cachedDarkStyle;
      try {
        const raw = await fetchBaseLibertyStyle();
        cachedDarkStyle = transformToNaturalDark(raw);
        return cachedDarkStyle;
      } catch (err) {
        console.warn('NomadMapEngine: Falling back to OpenFreeMap Dark style', err);
        return 'https://tiles.openfreemap.org/styles/dark';
      }
    }
  }

  // --- Zero-Reload Theme Switcher ---

  async function switchTheme(mapInstance, targetThemeId) {
    const validId = (targetThemeId === 'natural-light') ? 'natural-light' : 'natural-dark';
    activeThemeId = validId;

    try {
      localStorage.setItem('nomad_map_theme_id', activeThemeId);
    } catch (e) {}

    const selectedTheme = THEMES.find(t => t.id === activeThemeId) || THEMES[0];

    // If a MapLibre GL map instance is provided, swap style with diffing
    if (mapInstance && typeof mapInstance.setStyle === 'function') {
      try {
        const styleObj = await getStyleObject(activeThemeId);
        // MapLibre GL setStyle with diff: true prevents canvas recreation and keeps GPU tiles in memory
        mapInstance.setStyle(styleObj, { diff: true });
        mapInstance.once('styledata', () => {
          mapInstance.resize();
        });
      } catch (err) {
        console.error('NomadMapEngine setStyle error:', err);
      }
    }

    emitThemeChange(selectedTheme);
    return selectedTheme;
  }

  function toggleTheme(mapInstance) {
    const nextId = (activeThemeId === 'natural-dark') ? 'natural-light' : 'natural-dark';
    return switchTheme(mapInstance, nextId);
  }

  // --- AASHTO & MUTCD Highway Route Shield Generators ---

  /**
   * Generates authentic MUTCD Interstate Shield SVG with directional indicator dot
   */
  function createInterstateShieldSvg(num, direction = '') {
    if (!num) return '';
    const clean = String(num).toUpperCase().trim();
    const fontSize = clean.length > 2 ? '36' : '44';

    let dirDot = '';
    if (direction === 'North') {
      dirDot = '<circle cx="50" cy="11.5" r="3" fill="#ffffff" stroke="#cc0000" stroke-width="1" />';
    } else if (direction === 'South') {
      dirDot = '<circle cx="50" cy="87.5" r="3" fill="#ffffff" stroke="#0033cc" stroke-width="1" />';
    } else if (direction === 'East') {
      dirDot = '<circle cx="88" cy="50" r="3" fill="#ffffff" stroke="#0033cc" stroke-width="1" />';
    } else if (direction === 'West') {
      dirDot = '<circle cx="12" cy="50" r="3" fill="#ffffff" stroke="#0033cc" stroke-width="1" />';
    }

    return `
      <div class="highway-shield-badge interstate-shield-badge">
        <svg viewBox="0 0 100 100" style="overflow: visible; width: 100%; height: 100%;">
          <path d="M 50,4 C 65,4 88,14 96,18 C 96,55 82,82 50,96 C 18,82 4,55 4,18 C 12,14 35,4 50,4 Z" fill="#ffffff" stroke="#ffffff" stroke-width="2.5" />
          <path d="M 50,7 C 64,7 86,16 93,20 C 93,28 93,32 93,32 L 7,32 C 7,32 7,28 7,20 C 14,16 36,7 50,7 Z" fill="#cc0000" />
          <path d="M 7,32 L 93,32 C 93,54 80,80 50,93 C 20,80 7,54 7,32 Z" fill="#0033cc" />
          ${dirDot}
          <text x="50" y="74" fill="#ffffff" font-size="${fontSize}" font-weight="900" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" text-anchor="middle">${clean}</text>
        </svg>
      </div>
    `;
  }

  /**
   * Generates authentic MUTCD State or US Route Shield SVG with hairline border & directional dot
   */
  function createRouteShieldSvg(num, direction = '') {
    if (!num) return '';
    const clean = String(num).toUpperCase().trim();
    let fontSize = '50';
    let yPos = '68';
    let letterSpacing = '-0.5px';

    if (clean.length === 1) {
      fontSize = '56';
      yPos = '69';
    } else if (clean.length === 2) {
      fontSize = '50';
      yPos = '68';
    } else if (clean.length === 3) {
      fontSize = '38';
      yPos = '64';
      letterSpacing = '-1px';
    } else {
      fontSize = '30';
      yPos = '62';
      letterSpacing = '-1px';
    }

    let dirDot = '';
    if (direction === 'North') {
      dirDot = '<circle cx="50" cy="13.5" r="3.2" fill="#000000" />';
    } else if (direction === 'South') {
      dirDot = '<circle cx="50" cy="86.5" r="3.2" fill="#000000" />';
    } else if (direction === 'East') {
      dirDot = '<circle cx="86.5" cy="50" r="3.2" fill="#000000" />';
    } else if (direction === 'West') {
      dirDot = '<circle cx="13.5" cy="50" r="3.2" fill="#000000" />';
    }

    return `
      <div class="highway-shield-badge state-route-shield-badge">
        <svg viewBox="0 0 100 100" style="overflow: visible; width: 100%; height: 100%;">
          <rect x="2.5" y="2.5" width="95" height="95" rx="14" ry="14" fill="#ffffff" stroke="#000000" stroke-width="4.5" />
          <rect x="7.5" y="7.5" width="85" height="85" rx="9" ry="9" fill="none" stroke="#000000" stroke-width="1.8" />
          ${dirDot}
          <text x="50" y="${yPos}" fill="#000000" font-size="${fontSize}" font-weight="900" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" letter-spacing="${letterSpacing}" text-anchor="middle">${clean}</text>
        </svg>
      </div>
    `;
  }

  // --- Dual Route Multiplex Flipper ---

  function startDualRouteFlipper() {
    if (dualRouteIntervalId !== null) clearInterval(dualRouteIntervalId);
    dualRouteIntervalId = setInterval(() => {
      if (activeRouteShield && activeSecondaryRouteShield && activeRouteShield !== activeSecondaryRouteShield) {
        dualRouteFlipIndex = (dualRouteFlipIndex + 1) % 2;
        emitShieldChange();
      }
    }, 4000);
  }

  // --- Hook Telemetry for Route Shields ---

  function hookTelemetry() {
    if (typeof window === 'undefined') return;
    if (window.NomadTelemetryEngine && typeof window.NomadTelemetryEngine.onUpdate === 'function') {
      window.NomadTelemetryEngine.onUpdate((telemetry) => {
        if (!telemetry) return;
        activeInterstateShield = telemetry.interstateShield || null;
        activeRouteShield = telemetry.routeShield || null;
        activeSecondaryRouteShield = telemetry.secondaryRouteShield || null;
        activeHighwayDirection = telemetry.highwayDirection || '';
        emitShieldChange();
      });
    }
  }

  // --- Notification Dispatchers ---

  function emitThemeChange(theme) {
    for (let i = 0; i < themeSubscribers.length; i++) {
      try { themeSubscribers[i](theme); } catch (e) { console.error(e); }
    }
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('nomad-map-theme', { detail: theme }));
      } catch (e) {}
    }
  }

  function emitShieldChange() {
    const shieldData = getActiveShieldSnapshot();
    for (let i = 0; i < shieldSubscribers.length; i++) {
      try { shieldSubscribers[i](shieldData); } catch (e) { console.error(e); }
    }
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('nomad-map-shields', { detail: shieldData }));
      } catch (e) {}
    }
  }

  function emitPerspectiveChange(details) {
    for (let i = 0; i < perspectiveSubscribers.length; i++) {
      try { perspectiveSubscribers[i](details); } catch (e) { console.error(e); }
    }
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('nomad-map-perspective', { detail: details }));
      } catch (e) {}
    }
  }

  function getPerspectiveDetails(modeId = activePerspectiveMode) {
    return PERSPECTIVE_MODES.find(m => m.id === modeId) || PERSPECTIVE_MODES[0];
  }

  function setPerspectiveMode(modeId, mapInstance, currentHeading = 0) {
    const valid = PERSPECTIVE_MODES.find(m => m.id === modeId);
    if (!valid) return getPerspectiveDetails();
    activePerspectiveMode = valid.id;
    try {
      localStorage.setItem('nomad_perspective_mode', activePerspectiveMode);
    } catch (e) {}

    if (mapInstance && typeof mapInstance.easeTo === 'function') {
      const container = mapInstance.getContainer ? mapInstance.getContainer() : null;
      const h = container ? container.clientHeight : 240;
      const topPad = (valid.id === 'perspective') ? Math.round(h * valid.topPaddingRatio) : 0;
      if (typeof mapInstance.setPadding === 'function') {
        mapInstance.setPadding({ top: topPad, bottom: 0, left: 0, right: 0 });
      }
      const targetBearing = valid.isHeadingUp ? (currentHeading || 0) : 0;
      mapInstance.easeTo({
        pitch: valid.pitch,
        bearing: targetBearing,
        duration: 400
      });
    }

    emitPerspectiveChange(valid);
    return valid;
  }

  function cyclePerspectiveMode(mapInstance, currentHeading = 0) {
    let nextId = 'perspective';
    if (activePerspectiveMode === 'perspective') {
      nextId = 'overview';
    } else if (activePerspectiveMode === 'overview') {
      nextId = 'north-up';
    } else {
      nextId = 'perspective';
    }
    return setPerspectiveMode(nextId, mapInstance, currentHeading);
  }

  function getActiveShieldSnapshot() {
    let currentFlippedRoute = activeRouteShield;
    if (activeRouteShield && activeSecondaryRouteShield && dualRouteFlipIndex === 1) {
      currentFlippedRoute = activeSecondaryRouteShield;
    }

    return {
      interstateNum: activeInterstateShield,
      routeNum: currentFlippedRoute,
      secondaryRouteNum: activeSecondaryRouteShield,
      hasInterstate: Boolean(activeInterstateShield),
      hasRoute: Boolean(currentFlippedRoute),
      direction: activeHighwayDirection,
      interstateSvg: activeInterstateShield ? createInterstateShieldSvg(activeInterstateShield, activeHighwayDirection) : '',
      routeSvg: currentFlippedRoute ? createRouteShieldSvg(currentFlippedRoute, activeHighwayDirection) : '',
      timestamp: Date.now()
    };
  }

  // --- Init & Start ---

  function start() {
    hookTelemetry();
    startDualRouteFlipper();
    // Pre-cache styles in background
    setTimeout(() => {
      getStyleObject('natural-dark');
      getStyleObject('natural-light');
    }, 200);
  }

  if (typeof window !== 'undefined') {
    setTimeout(start, 50);
  }

  return {
    start,
    THEMES,
    getActiveThemeId: () => activeThemeId,
    getActiveTheme: () => THEMES.find(t => t.id === activeThemeId) || THEMES[0],
    getStyleObject,
    switchTheme,
    toggleTheme,
    createInterstateShieldSvg,
    createRouteShieldSvg,
    getActiveShields: getActiveShieldSnapshot,
    PERSPECTIVE_MODES,
    getPerspectiveMode: () => activePerspectiveMode,
    getPerspectiveDetails,
    setPerspectiveMode,
    cyclePerspectiveMode,
    onThemeChange: (cb) => {
      themeSubscribers.push(cb);
      try { cb(THEMES.find(t => t.id === activeThemeId) || THEMES[0]); } catch (e) {}
      return () => { const i = themeSubscribers.indexOf(cb); if (i !== -1) themeSubscribers.splice(i, 1); };
    },
    onShieldsChange: (cb) => {
      shieldSubscribers.push(cb);
      try { cb(getActiveShieldSnapshot()); } catch (e) {}
      return () => { const i = shieldSubscribers.indexOf(cb); if (i !== -1) shieldSubscribers.splice(i, 1); };
    },
    onPerspectiveChange: (cb) => {
      perspectiveSubscribers.push(cb);
      try { cb(getPerspectiveDetails()); } catch (e) {}
      return () => { const i = perspectiveSubscribers.indexOf(cb); if (i !== -1) perspectiveSubscribers.splice(i, 1); };
    }
  };
}));
