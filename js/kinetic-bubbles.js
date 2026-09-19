/**
 * NOMAD V4 HYPERSPACE - Kinetic Telemetry Bubbles Engine
 * /js/kinetic-bubbles.js
 *
 * Responsibilities:
 * - 6-Bubble Telemetry State & Metadata (Speed, Compass, Altitude, Temperature, Atmo, Coords)
 * - 60fps Kinetic Physics loop (wall deflection, pass-through wrap, vehicle safe zone collision)
 * - Dynamic shape frame spin engine (Keel buoyant pendulum sway, GPS velocity banking, Gyroscope compass sync)
 * - Contour-conforming SVG vector geometry rendering with notched channel/unit typography
 * - Direct pointer & touch interaction (instant hover-catch, drag-and-flick inertia, 600ms long press)
 * - Hyperspace Modal controls (tabs, presets, color swatches, opacity, size, motion mode, safe zone behavior)
 * - State persistence in localStorage ('nomad_v4_bubbles')
 */

(function() {
  'use strict';

  window.NomadState = window.NomadState || {};

  window.BUBBLE_KEYS = ['speed', 'compass', 'altitude', 'temp', 'atmo', 'coords'];

  window.BUBBLE_METADATA = {
    speed: { key: 'speed', title: 'Speed', unitDefault: 'MPH', channel: 'SPEED' },
    compass: { key: 'compass', title: 'Compass', unitDefault: 'DEG', channel: 'HEADING' },
    altitude: { key: 'altitude', title: 'Altitude', unitDefault: 'FT', channel: 'ALTITUDE' },
    temp: { key: 'temp', title: 'Temperature', unitDefault: '°F', channel: 'TEMP' },
    atmo: { key: 'atmo', title: 'Atmosphere', unitDefault: 'TRIAD', channel: 'ATMO' },
    coords: { key: 'coords', title: 'Coordinates', unitDefault: 'LAT/LON', channel: 'COORDS' }
  };

  // 6-Bubble State Objects
  window.nomadBubbles = {
    speed: {
      key: 'speed', active: true, shape: 'circle', color: '#00d4ff', opacity: 18, size: 90,
      mode: 'kinetic', wallBehavior: 'bounce', safeZoneBehavior: 'bounce',
      spinMode: 'keel', spinRate: 2, currentRotation: 0, angularVelocity: 0, keelTime: 0,
      speedLevel: 3, x: 28, y: 140, vx: 0.85, vy: 0.65, isDragging: false, isHovered: false
    },
    compass: {
      key: 'compass', active: true, shape: 'egg', color: '#ffb703', opacity: 18, size: 90,
      mode: 'kinetic', wallBehavior: 'bounce', safeZoneBehavior: 'bounce',
      spinMode: 'keel', spinRate: 2, currentRotation: 0, angularVelocity: 0, keelTime: 1.2,
      speedLevel: 3, x: 230, y: 150, vx: -0.75, vy: 0.80, isDragging: false, isHovered: false
    },
    altitude: {
      key: 'altitude', active: true, shape: 'squirkle', color: '#30d158', opacity: 18, size: 90,
      mode: 'kinetic', wallBehavior: 'bounce', safeZoneBehavior: 'bounce',
      spinMode: 'keel', spinRate: 2, currentRotation: 0, angularVelocity: 0, keelTime: 2.4,
      speedLevel: 3, x: 28, y: 310, vx: 0.90, vy: -0.70, isDragging: false, isHovered: false
    },
    temp: {
      key: 'temp', active: true, shape: 'hexagon', color: '#ff7700', opacity: 18, size: 90,
      mode: 'kinetic', wallBehavior: 'bounce', safeZoneBehavior: 'bounce',
      spinMode: 'keel', spinRate: 2, currentRotation: 0, angularVelocity: 0, keelTime: 3.6,
      speedLevel: 3, x: 230, y: 320, vx: -0.80, vy: -0.85, isDragging: false, isHovered: false
    },
    atmo: {
      key: 'atmo', active: true, shape: 'pentagon', color: '#bf5af2', opacity: 18, size: 95,
      mode: 'kinetic', wallBehavior: 'bounce', safeZoneBehavior: 'bounce',
      spinMode: 'keel', spinRate: 2, currentRotation: 0, angularVelocity: 0, keelTime: 4.8,
      speedLevel: 3, x: 28, y: 480, vx: 0.70, vy: 0.95, isDragging: false, isHovered: false,
      showHumidity: true, showUv: true, showPressure: true,
      displayFormat: 'ticker', tickerSpeed: 2.5, currentTickerIndex: 0
    },
    coords: {
      key: 'coords', active: true, shape: 'square', color: '#ffffff', opacity: 18, size: 95,
      mode: 'kinetic', wallBehavior: 'bounce', safeZoneBehavior: 'bounce',
      spinMode: 'keel', spinRate: 2, currentRotation: 0, angularVelocity: 0, keelTime: 5.5,
      speedLevel: 3, x: 230, y: 490, vx: -0.65, vy: -0.90, isDragging: false, isHovered: false
    }
  };

  // Global Bubble Settings (Inter-bubble collision & Units)
  try {
    const savedGlobals = localStorage.getItem('nomad_v4_bubble_globals');
    window.nomadBubbleGlobalSettings = savedGlobals ? JSON.parse(savedGlobals) : {
      interBubbleCollision: 'bounce',
      globalUnitSystem: 'imperial'
    };
  } catch (e) {
    window.nomadBubbleGlobalSettings = { interBubbleCollision: 'bounce', globalUnitSystem: 'imperial' };
  }

  window.altitudeUnit = localStorage.getItem('nomad_v4_altitude_unit') || 'ft';

  // Backward compatibility alias for legacy code referencing speedBubbleConfig
  window.speedBubbleConfig = window.nomadBubbles.speed;

  window.currentSelectedBubbleTab = 'speed';
  let kineticBubbleAnimFrame = null;
  const bubbleInteractionStates = {};

  /**
   * Initializes all 6 bubbles, loads persistent settings, and starts physics loop
   */
  window.initKineticSpeedBubble = function() {
    // 1. Load saved settings for all 6 bubbles
    try {
      const savedMulti = localStorage.getItem('nomad_v4_bubbles');
      if (savedMulti) {
        const parsedMulti = JSON.parse(savedMulti);
        window.BUBBLE_KEYS.forEach(k => {
          if (parsedMulti[k]) {
            if (parsedMulti[k].opacity === 44) parsedMulti[k].opacity = 18;
            Object.assign(window.nomadBubbles[k], parsedMulti[k]);
          }
        });
      } else {
        // Fallback for legacy single-bubble storage
        const savedLegacy = localStorage.getItem('nomad_v4_speed_bubble');
        if (savedLegacy) {
          const parsedLegacy = JSON.parse(savedLegacy);
          if (parsedLegacy.opacity === 44) parsedLegacy.opacity = 18;
          Object.assign(window.nomadBubbles.speed, parsedLegacy);
        }
      }
    } catch (e) {}

    // 2. Clamp initial coordinates within viewport
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    window.BUBBLE_KEYS.forEach(k => {
      const b = window.nomadBubbles[k];
      const s = b.size || 90;
      if (b.x > vw - s) b.x = Math.max(16, vw - s - 20);
      if (b.y > vh - s) b.y = Math.max(70, vh - s - 120);
    });

    // 3. Render all bubbles UI & attach interaction events
    window.BUBBLE_KEYS.forEach(k => {
      window.applyBubbleConfigUI(k);
      window.setupBubbleInteractions(k);
    });

    // 4. Initial rendering for compass, altitude, temp, atmo, coords
    if (typeof window.renderCompassBubble === 'function') window.renderCompassBubble(window.currentHeading);
    if (typeof window.renderAltitudeBubble === 'function') window.renderAltitudeBubble();
    if (typeof window.renderTemperatureBubble === 'function') window.renderTemperatureBubble();
    if (typeof window.renderAtmoBubble === 'function') window.renderAtmoBubble();
    if (typeof window.startAtmoTickerTimer === 'function') window.startAtmoTickerTimer();
    if (window.lastLat !== null && window.lastLon !== null && typeof window.renderCoordsBubble === 'function') {
      window.renderCoordsBubble(window.lastLat, window.lastLon);
    }

    // 5. Start unified kinetic physics animation loop
    window.startKineticBubbleLoop();
  };

  /**
   * Generates mathematical SVG vector markup with notched typography for each geometric shape.
   * Dynamically negotiates word length with an SVG knockout mask and matching aesthetic
   * pill badge frame so the shape stroke NEVER penetrates the label words on any geometry.
   */
  window.getBubbleShapeSVGMarkup = function(shape, hex, fill, channelLabel = 'SPEED', unitLabel = null, bubbleKey = 'speed', isLight = false) {
    const strokeW = 2.4;
    const strokeJoin = 'round';
    const strokeCap = 'round';
    if (!unitLabel) {
      unitLabel = (typeof window.isMph !== 'undefined' && !window.isMph) ? 'KM/H' : 'MPH';
    }

    const bottomText = channelLabel || '';
    const topText = unitLabel || '';
    const bottomLen = bottomText.length;
    const topLen = topText.length;

    // Responsive typography sizing for concise cockpit acronyms
    let bottomFontSize = '8.4';
    let bottomLetterSpacing = '1.1';
    if (bottomLen >= 6) {
      bottomFontSize = '7.4';
      bottomLetterSpacing = '0.8';
    } else if (bottomLen <= 3) {
      bottomFontSize = '8.8';
      bottomLetterSpacing = '1.4';
    }

    const topFontSize = (topLen <= 2) ? '8.8' : (topLen <= 4 ? '8.0' : '7.2');
    const topLetterSpacing = (topLen <= 2) ? '1.4' : '0.9';

    // Calculate dynamic gap dimensions so stroke ends cleanly before and resumes cleanly after text
    const bottomPillW = Math.max(22, bottomLen * 7.4 + 9);
    const bottomPillH = 12.5;
    const topPillW = Math.max(18, topLen * 7.4 + 9);
    const topPillH = 12.5;

    const maskId = `${bubbleKey || 'bubble'}-${shape || 'shape'}`;

    // Pure Transparent Gap - The SVG mask cleanly knocks out the shape stroke with zero dark box artifact
    const renderBadgesAndText = (topY, bottomY) => `
      <defs>
        <mask id="nomad-mask-${maskId}">
          <rect x="-10" y="-10" width="120" height="120" fill="#ffffff" />
          <rect x="${50 - topPillW / 2}" y="${topY - topPillH / 2}" width="${topPillW}" height="${topPillH}" rx="4" fill="#000000" />
          <rect x="${50 - bottomPillW / 2}" y="${bottomY - bottomPillH / 2}" width="${bottomPillW}" height="${bottomPillH}" rx="4" fill="#000000" />
        </mask>
      </defs>

      <!-- Top Notch Floating Typography -->
      <text x="50" y="${topY}" text-anchor="middle" dominant-baseline="central" fill="${hex}" font-size="${topFontSize}" font-weight="700" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" letter-spacing="${topLetterSpacing}" style="text-shadow: 0 1px 3px rgba(0,0,0,0.85);">${topText}</text>

      <!-- Bottom Notch Floating Typography -->
      <text x="50" y="${bottomY}" text-anchor="middle" dominant-baseline="central" fill="${hex}" font-size="${bottomFontSize}" font-weight="700" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" letter-spacing="${bottomLetterSpacing}" style="text-shadow: 0 1px 3px rgba(0,0,0,0.85);">${bottomText}</text>
    `;

    switch (shape) {
      case 'triangle': {
        const topY = 12;
        const bottomY = 72;
        return `
          <polygon points="50,6 88.1,72 11.9,72" fill="${fill}" stroke="none"/>
          <polygon points="50,6 88.1,72 11.9,72" fill="none" stroke="${hex}" stroke-width="${strokeW}" stroke-linejoin="${strokeJoin}" stroke-linecap="${strokeCap}" mask="url(#nomad-mask-${maskId})"/>
          ${renderBadgesAndText(topY, bottomY)}
        `;
      }

      case 'square': {
        const topY = 11;
        const bottomY = 89;
        return `
          <rect x="11" y="11" width="78" height="78" rx="12" fill="${fill}" stroke="none"/>
          <rect x="11" y="11" width="78" height="78" rx="12" fill="none" stroke="${hex}" stroke-width="${strokeW}" stroke-linejoin="${strokeJoin}" stroke-linecap="${strokeCap}" mask="url(#nomad-mask-${maskId})"/>
          ${renderBadgesAndText(topY, bottomY)}
        `;
      }

      case 'squirkle': {
        const topY = 9;
        const bottomY = 91;
        return `
          <rect x="9" y="9" width="82" height="82" rx="20" fill="${fill}" stroke="none"/>
          <rect x="9" y="9" width="82" height="82" rx="20" fill="none" stroke="${hex}" stroke-width="${strokeW}" stroke-linejoin="${strokeJoin}" stroke-linecap="${strokeCap}" mask="url(#nomad-mask-${maskId})"/>
          ${renderBadgesAndText(topY, bottomY)}
        `;
      }

      case 'hexagon': {
        const topY = 11.9;
        const bottomY = 88.1;
        return `
          <polygon points="28,11.9 72,11.9 94,50 72,88.1 28,88.1 6,50" fill="${fill}" stroke="none"/>
          <polygon points="28,11.9 72,11.9 94,50 72,88.1 28,88.1 6,50" fill="none" stroke="${hex}" stroke-width="${strokeW}" stroke-linejoin="${strokeJoin}" stroke-linecap="${strokeCap}" mask="url(#nomad-mask-${maskId})"/>
          ${renderBadgesAndText(topY, bottomY)}
        `;
      }

      case 'octagon': {
        const topY = 9.4;
        const bottomY = 90.6;
        return `
          <polygon points="33.2,9.4 66.8,9.4 90.6,33.2 90.6,66.8 66.8,90.6 33.2,90.6 9.4,66.8 9.4,33.2" fill="${fill}" stroke="none"/>
          <polygon points="33.2,9.4 66.8,9.4 90.6,33.2 90.6,66.8 66.8,90.6 33.2,90.6 9.4,66.8 9.4,33.2" fill="none" stroke="${hex}" stroke-width="${strokeW}" stroke-linejoin="${strokeJoin}" stroke-linecap="${strokeCap}" mask="url(#nomad-mask-${maskId})"/>
          ${renderBadgesAndText(topY, bottomY)}
        `;
      }

      case 'pentagon': {
        const topY = 9.5;
        const bottomY = 85.6;
        return `
          <polygon points="50,6 91.8,36.4 75.9,85.6 24.1,85.6 8.2,36.4" fill="${fill}" stroke="none"/>
          <polygon points="50,6 91.8,36.4 75.9,85.6 24.1,85.6 8.2,36.4" fill="none" stroke="${hex}" stroke-width="${strokeW}" stroke-linejoin="${strokeJoin}" stroke-linecap="${strokeCap}" mask="url(#nomad-mask-${maskId})"/>
          ${renderBadgesAndText(topY, bottomY)}
        `;
      }

      case 'egg': {
        const topY = 8;
        const bottomY = 88;
        const eggPath = 'M 50,7 C 74,7 94,14 94,34 C 94,62 84,84 70,88 L 30,88 C 16,84 6,62 6,34 C 6,14 26,7 50,7 Z';
        return `
          <path d="${eggPath}" fill="${fill}" stroke="none"/>
          <path d="${eggPath}" fill="none" stroke="${hex}" stroke-width="${strokeW}" stroke-linejoin="${strokeJoin}" stroke-linecap="${strokeCap}" mask="url(#nomad-mask-${maskId})"/>
          ${renderBadgesAndText(topY, bottomY)}
        `;
      }

      case 'circle':
      default: {
        const topY = 10.8;
        const bottomY = 89.2;
        return `
          <circle cx="50" cy="50" r="44" fill="${fill}" stroke="none"/>
          <circle cx="50" cy="50" r="44" fill="none" stroke="${hex}" stroke-width="${strokeW}" stroke-linejoin="${strokeJoin}" stroke-linecap="${strokeCap}" mask="url(#nomad-mask-${maskId})"/>
          ${renderBadgesAndText(topY, bottomY)}
        `;
      }
    }
  };

  /**
   * Calculates optimal font size for bubble telemetry so text NEVER overflows
   * any geometric shape boundary at any bubble size (80px - 180px).
   *
   * @param {string|number} text - Content string being rendered
   * @param {number} size - Outer bubble dimension in pixels
   * @param {string} shape - Geometric shape ('circle', 'egg', 'squirkle', 'square', 'triangle', 'pentagon', 'hexagon', 'octagon')
   * @param {object} options - Sizing configuration (maxScale, minPx, hasSubLabel)
   * @returns {string} Font size in CSS px (e.g. '24.5px')
   */
  window.calculateDynamicBubbleFontSize = function(text, size = 90, shape = 'circle', options = {}) {
    const str = String(text != null ? text : '').trim();
    const len = Math.max(1, str.length);

    let shapeFactor = 0.74;
    switch (shape) {
      case 'triangle': shapeFactor = 0.50; break;
      case 'pentagon': shapeFactor = 0.58; break;
      case 'hexagon': shapeFactor = 0.66; break;
      case 'octagon': shapeFactor = 0.70; break;
      case 'egg': shapeFactor = 0.72; break;
      case 'squirkle': shapeFactor = 0.75; break;
      case 'square': shapeFactor = 0.76; break;
      case 'circle':
      default: shapeFactor = 0.74; break;
    }

    const maxScale = options.maxScale || 0.40;
    const minPx = options.minPx || 9.5;
    const usableWidth = size * shapeFactor;

    let charWidthRatio = 0.56;
    if (str.includes('.') || str.includes('°') || str.includes(':') || str.includes('%')) {
      charWidthRatio = 0.50;
    }

    const sizeByWidth = usableWidth / (len * charWidthRatio);
    const heightFactor = options.hasSubLabel ? (maxScale * 0.85) : maxScale;
    const sizeByHeight = size * heightFactor;

    let fitted = Math.min(sizeByWidth, sizeByHeight);
    fitted = Math.max(minPx, fitted);

    return `${fitted.toFixed(1)}px`;
  };

  /**
   * Applies configuration styling and SVG vector frame to a specific bubble's DOM
   */
  window.applyBubbleConfigUI = function(bubbleKey = window.currentSelectedBubbleTab) {
    const b = window.nomadBubbles[bubbleKey];
    if (!b) return;

    const el = document.getElementById(`${bubbleKey}-bubble`);
    const shapeFrame = document.getElementById(`${bubbleKey}-bubble-shape-frame`);
    const pinEl = document.getElementById(`${bubbleKey}-bubble-pin`);
    if (!el) return;

    // 0. Active Status (Visible vs Hidden)
    if (b.active === false) {
      el.style.display = 'none';
      return;
    } else {
      el.style.display = 'flex';
    }

    // 1. Dimensions
    const size = b.size || 90;
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;

    // Outer container is 100% transparent with zero rectangular bounding box artifacts
    el.style.background = 'transparent';
    el.style.backgroundColor = 'transparent';
    el.style.border = 'none';
    el.style.boxShadow = 'none';
    el.style.outline = 'none';

    // 2. Color & Glass Transparency
    const hex = b.color || '#00d4ff';
    const isLight = document.getElementById('map-card')?.classList.contains('theme-light-active') || (window.currentThemeIndex === 1);
    const rawOpacity = (typeof b.opacity === 'number') ? b.opacity : 18;
    const alpha = (Math.max(0, Math.min(100, rawOpacity)) / 100).toFixed(2);

    let fill = 'transparent';
    if (rawOpacity > 0) {
      fill = isLight ? `rgba(255, 255, 255, ${alpha})` : `rgba(8, 14, 26, ${alpha})`;
    }

    // Synchronize CSS accent color variable
    el.style.setProperty('--bubble-accent', hex);
    el.style.color = hex;

    // Update classes for optical centroid offsets and rotation states
    el.className = `kinetic-bubble has-shape-${b.shape}` +
      (b.isHovered ? ' is-hovered' : '') +
      (b.isDragging ? ' is-dragging' : '') +
      ((b.spinMode && b.spinMode !== 'off') ? ' is-spinning' : '');

    // 3. Render SVG Vector Geometry with channel label and unit label
    let channelLabel = 'SPEED';
    let unitLabel = (window.isMph === false) ? 'KM/H' : 'MPH';

    if (bubbleKey === 'compass') {
      channelLabel = 'CMPS';
      const h = (typeof window.currentHeading === 'number' && !isNaN(window.currentHeading) && window.currentHeading !== 0)
        ? window.currentHeading
        : (window.map && typeof window.map.getBearing === 'function' ? ((window.map.getBearing() % 360 + 360) % 360) : 0);
      const getCard = (typeof window.getCardinalDirection === 'function') 
        ? window.getCardinalDirection 
        : (a => ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round((a || 0) / 45) % 8]);
      unitLabel = getCard(h);
    } else if (bubbleKey === 'altitude') {
      channelLabel = 'ALT';
      unitLabel = (window.altitudeUnit === 'm') ? 'M' : 'FT';
    } else if (bubbleKey === 'temp') {
      channelLabel = 'TEMP';
      unitLabel = (window.isFahrenheit === false) ? '°C' : '°F';
    } else if (bubbleKey === 'atmo') {
      channelLabel = 'ATMO';
      if (b.displayFormat !== 'stack') {
        const activeMetrics = [
          b.showHumidity !== false && 'humidity',
          b.showUv !== false && 'uv',
          b.showPressure !== false && 'pressure'
        ].filter(Boolean);
        const cur = activeMetrics[(b.currentTickerIndex || 0) % (activeMetrics.length || 1)] || 'humidity';
        unitLabel = (cur === 'humidity') ? 'HUM' : ((cur === 'uv') ? 'UV' : 'BARO');
      } else {
        unitLabel = 'AIR';
      }
    } else if (bubbleKey === 'coords') {
      channelLabel = 'LALO';
      unitLabel = 'GPS';
    }

    if (shapeFrame) {
      shapeFrame.innerHTML = `<svg viewBox="0 0 100 100" class="kinetic-shape-svg" style="width:100%;height:100%;overflow:visible;display:block;filter:none;">${window.getBubbleShapeSVGMarkup(b.shape, hex, fill, channelLabel, unitLabel, bubbleKey, isLight)}</svg>`;
      shapeFrame.style.border = 'none';
      shapeFrame.style.background = 'transparent';
      shapeFrame.style.outline = 'none';
      shapeFrame.style.boxShadow = 'none';
      shapeFrame.style.transform = `rotate(${b.currentRotation || 0}deg)`;
    }

    // Dynamic text sizing based on bubble dimension, geometry, and live content
    if (bubbleKey === 'speed') {
      if (typeof window.renderSpeedBubble === 'function') window.renderSpeedBubble();
    } else if (bubbleKey === 'compass') {
      if (typeof window.renderCompassBubble === 'function') window.renderCompassBubble();
    } else if (bubbleKey === 'altitude') {
      if (typeof window.renderAltitudeBubble === 'function') window.renderAltitudeBubble();
    } else if (bubbleKey === 'temp') {
      if (typeof window.renderTemperatureBubble === 'function') window.renderTemperatureBubble();
    } else if (bubbleKey === 'atmo') {
      if (typeof window.renderAtmoBubble === 'function') window.renderAtmoBubble();
    } else if (bubbleKey === 'coords') {
      if (typeof window.renderCoordsBubble === 'function') window.renderCoordsBubble();
    }

    // 4. Mode Pin indicator
    if (pinEl) {
      pinEl.style.display = (b.mode === 'stationary') ? 'block' : 'none';
    }

    // 5. Position
    el.style.left = `${b.x}px`;
    el.style.top = `${b.y}px`;
  };

  /**
   * Persists multi-bubble configuration to localStorage
   */
  window.saveBubbleConfig = function() {
    try {
      localStorage.setItem('nomad_v4_bubbles', JSON.stringify(window.nomadBubbles));
      // Save legacy speed bubble for backward compatibility
      if (window.nomadBubbles.speed) {
        localStorage.setItem('nomad_v4_speed_bubble', JSON.stringify(window.nomadBubbles.speed));
      }
    } catch (e) {}
  };

  /**
   * Starts the 60fps kinetic physics loop
   */
  window.startKineticBubbleLoop = function() {
    if (kineticBubbleAnimFrame) cancelAnimationFrame(kineticBubbleAnimFrame);

    function step() {
      window.BUBBLE_KEYS.forEach(k => {
        const b = window.nomadBubbles[k];
        if (!b || b.active === false) return;

        // Freeze kinetic movement if hovered by cursor, being dragged, or pinned in stationary mode
        if (b.mode === 'kinetic' && !b.isDragging && !b.isHovered) {
          updateBubblePhysics(k);
        }

        // Shape Dynamic Rotation (Text remains upright, outer shape spins based on Keel, GPS speed, or Gyro/Heading)
        if (b.spinMode && b.spinMode !== 'off') {
          updateBubbleShapeSpin(k);
        }
      });

      // Inter-bubble elastic collision resolution (Pinball mode vs Ghost mode)
      resolveBubbleCollisions();

      // Orbiting Satellite Moon / Scanner Dot continuous physics
      if (typeof window.updateSatelliteMoonOrbit === 'function') {
        window.updateSatelliteMoonOrbit();
      }

      // Flush coordinates to DOM
      window.BUBBLE_KEYS.forEach(k => {
        const b = window.nomadBubbles[k];
        if (!b || b.active === false) return;
        const el = document.getElementById(`${k}-bubble`);
        if (el) {
          el.style.left = `${b.x}px`;
          el.style.top = `${b.y}px`;
        }
      });

      kineticBubbleAnimFrame = requestAnimationFrame(step);
    }
    kineticBubbleAnimFrame = requestAnimationFrame(step);
  };

  /**
   * Updates dynamic rotation angle for outer geometric frame
   */
  function updateBubbleShapeSpin(bubbleKey) {
    const b = window.nomadBubbles[bubbleKey];
    if (!b) return;
    const shapeFrame = document.getElementById(`${bubbleKey}-bubble-shape-frame`);
    if (!shapeFrame) return;

    const rateMultiplier = [0, 0.5, 1.0, 1.5, 2.0, 3.0][b.spinRate || 2] || 1.0;

    if (b.spinMode === 'keel') {
      b.keelTime = (b.keelTime || 0) + (0.048 * rateMultiplier);

      const motionTilt = Math.max(-10.0, Math.min(10.0, -b.vx * 3.6 * rateMultiplier));
      const cruisingSway = (Math.sin(b.keelTime) * 4.2 + Math.cos(b.keelTime * 0.65) * 1.8) * rateMultiplier;
      const targetAngle = motionTilt + cruisingSway;

      const currentAngle = b.currentRotation || 0;
      const displacement = currentAngle - targetAngle;
      const absAngle = Math.abs(currentAngle);

      let springK = 0.08 * rateMultiplier;
      let damping = 0.94;

      if (absAngle > 40) {
        const excess = absAngle - 40;
        springK = (0.22 + excess * 0.025) * rateMultiplier;
        damping = 0.86;
      } else if (absAngle > 28) {
        springK = 0.12 * rateMultiplier;
        damping = 0.91;
      }

      b.angularVelocity = ((b.angularVelocity || 0) - (displacement * springK)) * damping;
      b.angularVelocity = Math.max(-20, Math.min(20, b.angularVelocity));

      if (absAngle < 7.0 && Math.abs(b.angularVelocity) < 0.9) {
        b.angularVelocity *= 0.92;
        if (absAngle < 1.0 && Math.abs(b.angularVelocity) < 0.18) {
          b.angularVelocity = 0;
        }
      }

      b.currentRotation = currentAngle + b.angularVelocity;

      if (b.currentRotation > 48) {
        b.currentRotation = 48;
        b.angularVelocity = -Math.abs(b.angularVelocity) * 0.4;
      } else if (b.currentRotation < -48) {
        b.currentRotation = -48;
        b.angularVelocity = Math.abs(b.angularVelocity) * 0.4;
      }

      shapeFrame.style.transform = `rotate(${b.currentRotation.toFixed(1)}deg)`;
    } else if (b.spinMode === 'gps') {
      const currentMph = (window.rawSpeedMps !== null && !isNaN(window.rawSpeedMps)) ? (window.rawSpeedMps * 2.23694) : 0;
      const speedBank = Math.sin(Date.now() * 0.002) * Math.min(22, 4 + (currentMph * 0.25)) * rateMultiplier;
      b.currentRotation = speedBank;
      shapeFrame.style.transform = `rotate(${b.currentRotation.toFixed(1)}deg)`;
    } else if (b.spinMode === 'gyro') {
      const targetHeading = typeof window.currentHeading === 'number' ? window.currentHeading : 0;
      b.currentRotation = targetHeading;
      shapeFrame.style.transform = `rotate(${targetHeading.toFixed(1)}deg)`;
    } else {
      b.currentRotation = 0;
      shapeFrame.style.transform = 'rotate(0deg)';
    }
  }

  /**
   * Executes kinetic physics calculations (velocities, wall bounce vs wrap, and safezone deflection)
   */
  function updateBubblePhysics(bubbleKey) {
    const b = window.nomadBubbles[bubbleKey];
    if (!b || b.active === false) return;
    const el = document.getElementById(`${bubbleKey}-bubble`);
    if (!el) return;

    const size = b.size || 90;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Base speed multiplier from slider (1 to 5)
    const speedMultiplier = 0.4 + ((b.speedLevel || 3) * 0.45);
    const rateMultiplier = [0, 0.5, 1.0, 1.5, 2.0, 3.0][b.spinRate || 2] || 1.0;

    // Move by velocity
    b.x += b.vx * speedMultiplier;
    b.y += b.vy * speedMultiplier;

    // 1. Boundary Wall Interaction: Pass Through & Wrap vs Bounce Off Walls
    if (b.wallBehavior === 'wrap') {
      // Continuous Toroidal Screen Wrap: As soon as the leading edge/half penetrates a wall,
      // it immediately re-emerges on the opposite side with zero dead time.
      const leadMargin = size * 0.45;
      const emergeMargin = size * 0.55;

      if (b.vx > 0 && b.x > (vw - leadMargin)) {
        b.x = -emergeMargin;
      } else if (b.vx < 0 && b.x < -leadMargin) {
        b.x = vw - emergeMargin;
      }

      if (b.vy > 0 && b.y > (vh - leadMargin)) {
        b.y = -emergeMargin;
      } else if (b.vy < 0 && b.y < -leadMargin) {
        b.y = vh - emergeMargin;
      }
    } else {
      // Full screen edge-to-edge and corner-to-corner bounce (glides underneath top buttons and bottom location bar)
      const topLimit = 0;
      const bottomLimit = Math.max(0, vh - size);
      const leftLimit = 0;
      const rightLimit = Math.max(0, vw - size);

      if (b.x <= leftLimit) {
        b.x = leftLimit;
        b.vx = Math.abs(b.vx);
        if (b.spinMode === 'keel') {
          b.angularVelocity = Math.min(15, (b.angularVelocity || 0) + 11 * rateMultiplier);
        }
      } else if (b.x >= rightLimit) {
        b.x = rightLimit;
        b.vx = -Math.abs(b.vx);
        if (b.spinMode === 'keel') {
          b.angularVelocity = Math.max(-15, (b.angularVelocity || 0) - 11 * rateMultiplier);
        }
      }

      if (b.y <= topLimit) {
        b.y = topLimit;
        b.vy = Math.abs(b.vy);
        if (b.spinMode === 'keel') {
          const impulse = Math.max(-8, Math.min(8, b.vx * 4.5)) * rateMultiplier;
          b.angularVelocity += impulse;
        }
      } else if (b.y >= bottomLimit) {
        b.y = bottomLimit;
        b.vy = -Math.abs(b.vy);
        if (b.spinMode === 'keel') {
          const impulse = Math.max(-8, Math.min(8, -b.vx * 4.5)) * rateMultiplier;
          b.angularVelocity += impulse;
        }
      }
    }

    // 2. Vehicle Safe Zone Deflection (only active when safeZoneBehavior is 'bounce')
    if (b.safeZoneBehavior === 'bounce' && typeof window.getNomadVehicleSafeZone === 'function') {
      const safeZone = window.getNomadVehicleSafeZone();
      if (safeZone) {
        const bubbleCenterX = b.x + size / 2;
        const bubbleCenterY = b.y + size / 2;

        const dx = bubbleCenterX - safeZone.x;
        const dy = bubbleCenterY - safeZone.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const minSafeDist = (size / 2) + safeZone.radius;

        if (dist < minSafeDist && dist > 0.001) {
          const nx = dx / dist;
          const ny = dy / dist;

          const overlap = minSafeDist - dist;
          b.x += nx * overlap;
          b.y += ny * overlap;

          const dot = (b.vx * nx) + (b.vy * ny);
          b.vx = b.vx - 2 * dot * nx;
          b.vy = b.vy - 2 * dot * ny;

          if (b.spinMode === 'keel') {
            const tangentImpulse = (-nx * b.vy + ny * b.vx);
            b.angularVelocity = Math.max(-13, Math.min(13, (b.angularVelocity || 0) + tangentImpulse * 8 * rateMultiplier));
          }

          const curSpeed = Math.sqrt(b.vx * b.vx + b.vy * b.vy) || 1;
          b.vx = (b.vx / curSpeed) * 1.4;
          b.vy = (b.vy / curSpeed) * 1.4;

          // Trigger orbit spin reversal and pulse on satellite moon
          if (typeof window.triggerSafeZoneDeflectionFlip === 'function') {
            window.triggerSafeZoneDeflectionFlip(b.key);
          }
        }
      }
    }

    el.style.left = `${b.x}px`;
    el.style.top = `${b.y}px`;
  }

  /**
   * Resolves 2D elastic collisions between kinetic bubbles (Pinball mode vs Ghost mode)
   */
  function resolveBubbleCollisions() {
    if (!window.nomadBubbleGlobalSettings || window.nomadBubbleGlobalSettings.interBubbleCollision === 'ghost') return;

    const keys = window.BUBBLE_KEYS;
    const len = keys.length;

    for (let i = 0; i < len; i++) {
      const b1 = window.nomadBubbles[keys[i]];
      if (!b1 || b1.active === false) continue;
      const size1 = b1.size || 90;
      const r1 = size1 / 2;
      const c1x = b1.x + r1;
      const c1y = b1.y + r1;

      for (let j = i + 1; j < len; j++) {
        const b2 = window.nomadBubbles[keys[j]];
        if (!b2 || b2.active === false) continue;
        const size2 = b2.size || 90;
        const r2 = size2 / 2;
        const c2x = b2.x + r2;
        const c2y = b2.y + r2;

        const dx = c2x - c1x;
        const dy = c2y - c1y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = r1 + r2;

        if (dist < minDist && dist > 0.001) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;

          const b1Kinetic = (b1.mode === 'kinetic' && !b1.isDragging && !b1.isHovered);
          const b2Kinetic = (b2.mode === 'kinetic' && !b2.isDragging && !b2.isHovered);

          // Positional separation to guarantee zero visual overlap
          if (b1Kinetic && b2Kinetic) {
            b1.x -= nx * (overlap * 0.5);
            b1.y -= ny * (overlap * 0.5);
            b2.x += nx * (overlap * 0.5);
            b2.y += ny * (overlap * 0.5);
          } else if (b1Kinetic && !b2Kinetic) {
            b1.x -= nx * overlap;
            b1.y -= ny * overlap;
          } else if (!b1Kinetic && b2Kinetic) {
            b2.x += nx * overlap;
            b2.y += ny * overlap;
          }

          // Elastic momentum exchange
          if (b1Kinetic || b2Kinetic) {
            const v1x = b1Kinetic ? b1.vx : 0;
            const v1y = b1Kinetic ? b1.vy : 0;
            const v2x = b2Kinetic ? b2.vx : 0;
            const v2y = b2Kinetic ? b2.vy : 0;

            const kx = v1x - v2x;
            const ky = v1y - v2y;
            const normalVel = (kx * nx + ky * ny);

            // Deflect only when moving toward one another
            if (normalVel > 0) {
              const m1 = r1;
              const m2 = r2;
              const impulse = (2 * normalVel) / (m1 + m2);

              if (b1Kinetic) {
                b1.vx -= impulse * m2 * nx;
                b1.vy -= impulse * m2 * ny;
                if (b1.spinMode === 'keel') {
                  b1.angularVelocity = Math.max(-12, Math.min(12, (b1.angularVelocity || 0) + (-nx * b1.vy + ny * b1.vx) * 5));
                }
              }
              if (b2Kinetic) {
                b2.vx += impulse * m1 * nx;
                b2.vy += impulse * m1 * ny;
                if (b2.spinMode === 'keel') {
                  b2.angularVelocity = Math.max(-12, Math.min(12, (b2.angularVelocity || 0) + (-nx * b2.vy + ny * b2.vx) * 5));
                }
              }
            }
          }
        }
      }
    }
  }

  /**
   * Sets up pointer, drag, flick, and long press events for a single bubble
   */
  window.setupBubbleInteractions = function(bubbleKey) {
    const el = document.getElementById(`${bubbleKey}-bubble`);
    if (!el) return;

    const state = {
      dragStartX: 0,
      dragStartY: 0,
      initialX: 0,
      initialY: 0,
      lastDragTime: 0,
      dragVelocityX: 0,
      dragVelocityY: 0,
      longPressTimer: null
    };
    bubbleInteractionStates[bubbleKey] = state;

    const b = window.nomadBubbles[bubbleKey];

    // Mouse enter & leave: freeze bubble kinetic motion instantly on hover so user can easily catch & long press
    el.addEventListener('mouseenter', () => {
      b.isHovered = true;
      el.classList.add('is-hovered');
    });

    el.addEventListener('mouseleave', () => {
      b.isHovered = false;
      el.classList.remove('is-hovered');
    });

    function onPointerDown(clientX, clientY, event) {
      state.dragStartX = clientX;
      state.dragStartY = clientY;
      state.initialX = b.x;
      state.initialY = b.y;
      state.lastDragTime = Date.now();
      state.dragVelocityX = 0;
      state.dragVelocityY = 0;
      b.isDragging = false;

      // Long press trigger (600ms) for opening configuration modal directly for THIS bubble
      el.classList.add('is-longpressing');
      clearTimeout(state.longPressTimer);
      state.longPressTimer = setTimeout(() => {
        b.isDragging = false;
        el.classList.remove('is-longpressing');
        if (navigator.vibrate) {
          try { navigator.vibrate(35); } catch(e) {}
        }
        if (typeof window.openKineticBubbleModal === 'function') {
          window.openKineticBubbleModal(bubbleKey);
        }
      }, 600);
    }

    function onPointerMove(clientX, clientY, event) {
      const dx = clientX - state.dragStartX;
      const dy = clientY - state.dragStartY;

      // Threshold to start repositioning / dragging (12px to allow steady finger long press without accidental drag cancel)
      if (Math.abs(dx) > 12 || Math.abs(dy) > 12) {
        clearTimeout(state.longPressTimer);
        el.classList.remove('is-longpressing');
        b.isDragging = true;
        el.classList.add('is-dragging');

        const now = Date.now();
        const dt = Math.max(16, now - state.lastDragTime);
        const newX = state.initialX + dx;
        const newY = state.initialY + dy;

        state.dragVelocityX = (newX - b.x) / (dt / 16);
        state.dragVelocityY = (newY - b.y) / (dt / 16);

        b.x = newX;
        b.y = newY;
        state.lastDragTime = now;

        el.style.left = `${b.x}px`;
        el.style.top = `${b.y}px`;

        if (b.spinMode === 'keel') {
          b.angularVelocity = Math.max(-12, Math.min(12, -state.dragVelocityX * 2.2));
        }
      }
    }

    function onPointerUp() {
      clearTimeout(state.longPressTimer);
      el.classList.remove('is-longpressing');
      if (b.isDragging) {
        b.isDragging = false;
        el.classList.remove('is-dragging');

        // Impart flick velocity if in kinetic mode
        if (b.mode === 'kinetic') {
          const flickX = Math.max(-3.5, Math.min(3.5, state.dragVelocityX * 0.7));
          const flickY = Math.max(-3.5, Math.min(3.5, state.dragVelocityY * 0.7));
          if (Math.abs(flickX) > 0.4 || Math.abs(flickY) > 0.4) {
            b.vx = flickX;
            b.vy = flickY;
            if (b.spinMode === 'keel') {
              b.angularVelocity = Math.max(-14, Math.min(14, flickX * 4.8));
            }
          }
        }
        window.saveBubbleConfig();
      } else {
        // Quick tap without drag: for ATMOS bubble in ticker mode, tap immediately advances to the next active metric!
        if (bubbleKey === 'atmo' && b.displayFormat !== 'stack') {
          const activeMetrics = [
            b.showHumidity !== false && 'humidity',
            b.showUv !== false && 'uv',
            b.showPressure !== false && 'pressure'
          ].filter(Boolean);
          if (activeMetrics.length > 1) {
            const hero = document.getElementById('atmo-ticker-hero');
            if (hero) hero.classList.add('atmo-ticker-transitioning');
            setTimeout(() => {
              b.currentTickerIndex = ((b.currentTickerIndex || 0) + 1) % activeMetrics.length;
              window.renderAtmoBubble();
              if (hero) hero.classList.remove('atmo-ticker-transitioning');
            }, 80);
            window.startAtmoTickerTimer();
            if (navigator.vibrate) {
              try { navigator.vibrate(12); } catch (_) {}
            }
          }
        }
      }
    }

    // Touch events
    let isTrackingTouch = false;
    el.addEventListener('touchstart', (e) => {
      b.isHovered = true; // freeze on finger contact
      if (e.touches.length === 1) {
        isTrackingTouch = true;
        onPointerDown(e.touches[0].clientX, e.touches[0].clientY, e);
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (isTrackingTouch && (b.isDragging || state.longPressTimer)) {
        if (e.touches.length === 1) {
          onPointerMove(e.touches[0].clientX, e.touches[0].clientY, e);
        }
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      if (isTrackingTouch) {
        isTrackingTouch = false;
        b.isHovered = false;
        onPointerUp();
      }
    }, { passive: true });

    window.addEventListener('touchcancel', () => {
      if (isTrackingTouch) {
        isTrackingTouch = false;
        b.isHovered = false;
        clearTimeout(state.longPressTimer);
        state.longPressTimer = null;
        el.classList.remove('is-longpressing');
        if (b.isDragging) {
          b.isDragging = false;
          el.classList.remove('is-dragging');
        }
      }
    }, { passive: true });

    // Mouse events for desktop
    el.addEventListener('mousedown', (e) => {
      e.preventDefault();
      onPointerDown(e.clientX, e.clientY, e);

      function mouseMoveHandler(me) {
        onPointerMove(me.clientX, me.clientY, me);
      }
      function mouseUpHandler() {
        window.removeEventListener('mousemove', mouseMoveHandler);
        window.removeEventListener('mouseup', mouseUpHandler);
        onPointerUp();
      }
      window.addEventListener('mousemove', mouseMoveHandler);
      window.addEventListener('mouseup', mouseUpHandler);
    });
  };

  window.setupSpeedBubbleInteractions = function() {
    window.setupBubbleInteractions('speed');
  };

  /**
   * Modal Tab Navigation
   */
  window.switchBubbleTab = function(tabId) {
    if (tabId !== 'vehicle' && !window.BUBBLE_KEYS.includes(tabId)) return;
    window.currentSelectedBubbleTab = tabId;

    // 1. Update tab buttons active states and status indicators
    window.BUBBLE_KEYS.forEach(k => {
      const tabBtn = document.getElementById(`bubble-tab-${k}`);
      if (tabBtn) tabBtn.classList.toggle('is-active', k === tabId);
      const statusDot = document.getElementById(`bubble-tab-status-${k}`);
      if (statusDot) statusDot.classList.toggle('is-active', window.nomadBubbles[k].active !== false);
    });

    const vehicleTabBtn = document.getElementById('bubble-tab-vehicle');
    if (vehicleTabBtn) vehicleTabBtn.classList.toggle('is-active', tabId === 'vehicle');
    const vehicleStatusDot = document.getElementById('bubble-tab-status-vehicle');
    if (vehicleStatusDot) vehicleStatusDot.classList.toggle('is-active', window.nomadVehicleConfig && window.nomadVehicleConfig.satelliteActive !== false);

    const bubbleControls = document.getElementById('bubble-specific-controls');
    const vehicleSection = document.getElementById('vehicle-options-section');

    if (tabId === 'vehicle') {
      const titleEl = document.getElementById('bubble-modal-title');
      if (titleEl) titleEl.innerText = 'Vehicle & Safe-Zone Config';

      if (bubbleControls) bubbleControls.style.display = 'none';
      if (vehicleSection) vehicleSection.style.display = 'block';

      if (typeof window.syncVehicleModalUI === 'function') {
        window.syncVehicleModalUI();
      }
      return;
    }

    if (bubbleControls) bubbleControls.style.display = 'block';
    if (vehicleSection) vehicleSection.style.display = 'none';

    // 2. Update modal title
    const meta = window.BUBBLE_METADATA[tabId];
    const titleEl = document.getElementById('bubble-modal-title');
    if (titleEl && meta) {
      titleEl.innerText = `${meta.title} Bubble Config`;
    }

    // 3. Show/hide tab-specific sections
    const atmoSection = document.getElementById('atmo-options-section');
    if (atmoSection) {
      atmoSection.style.display = (tabId === 'atmo') ? 'block' : 'none';
    }
    const coordsSection = document.getElementById('coords-options-section');
    if (coordsSection) {
      coordsSection.style.display = (tabId === 'coords') ? 'block' : 'none';
    }

    // 4. Sync modal controls for this bubble
    window.syncModalControlsForTab(tabId);
  };

  window.syncBubbleModalWithState = function() {
    window.switchBubbleTab(window.currentSelectedBubbleTab);
  };

  window.syncModalControlsForTab = function(tabId) {
    const b = window.nomadBubbles[tabId];
    if (!b) return;

    window.setBubbleActiveUI(b.active !== false);
    window.setBubbleMotionModeUI(b.mode || 'kinetic');
    window.setBubbleSafeZoneBehaviorUI(b.safeZoneBehavior || 'bounce');
    window.setBubbleWallBehaviorUI(b.wallBehavior || 'bounce');
    window.setBubbleShapeUI(b.shape || 'circle');
    window.setBubbleColorUI(b.color || '#00d4ff');
    window.setBubbleSizeUI(b.size || 90);

    const isStationary = (b.mode === 'stationary');
    const safezoneSection = document.getElementById('bubble-safezone-section');
    const safezoneGroup = document.getElementById('bubble-safezone-group');
    const safezoneTitle = document.getElementById('bubble-safezone-title');
    const wallSection = document.getElementById('bubble-wall-section');
    const wallGroup = document.getElementById('bubble-wall-group');
    const wallTitle = document.getElementById('bubble-wall-title');
    const speedSliderWrap = document.getElementById('bubble-speed-slider-wrap');

    if (safezoneSection) safezoneSection.style.display = isStationary ? 'none' : 'block';
    else {
      if (safezoneGroup) safezoneGroup.style.display = isStationary ? 'none' : 'flex';
      if (safezoneTitle) safezoneTitle.style.display = isStationary ? 'none' : 'block';
    }

    if (wallSection) wallSection.style.display = isStationary ? 'none' : 'block';
    else {
      if (wallGroup) wallGroup.style.display = isStationary ? 'none' : 'flex';
      if (wallTitle) wallTitle.style.display = isStationary ? 'none' : 'block';
    }

    if (speedSliderWrap) speedSliderWrap.style.display = isStationary ? 'none' : 'block';

    // Opacity
    const opacitySlider = document.getElementById('bubble-opacity-slider');
    const opacityLabel = document.getElementById('bubble-opacity-val-label');
    const currentOpacity = (typeof b.opacity === 'number') ? b.opacity : 18;
    if (opacitySlider) opacitySlider.value = currentOpacity;
    if (opacityLabel) {
      if (currentOpacity === 0) {
        opacityLabel.innerText = '0% Crystal Clear';
      } else if (currentOpacity <= 25) {
        opacityLabel.innerText = `${currentOpacity}% Sheer Glass`;
      } else {
        opacityLabel.innerText = `${currentOpacity}% Frosted Tint`;
      }
    }

    // Size
    const sizeSlider = document.getElementById('bubble-size-slider');
    if (sizeSlider) sizeSlider.value = b.size || 90;

    // Speed
    const speedSlider = document.getElementById('bubble-speed-slider');
    const speedLabel = document.getElementById('bubble-speed-val-label');
    if (speedSlider) speedSlider.value = b.speedLevel || 3;
    if (speedLabel) {
      const speedNames = ['', 'Gentle', 'Slow', 'Cruising Drift', 'Swift', 'Hyper'];
      speedLabel.innerText = speedNames[b.speedLevel || 3] || 'Drift';
    }

    // Spin Mode
    window.setBubbleSpinModeUI(b.spinMode || 'keel');
    const spinSlider = document.getElementById('bubble-spin-slider');
    const spinLabel = document.getElementById('bubble-spin-val-label');
    const spinSliderWrap = document.getElementById('bubble-spin-intensity-wrap');
    if (spinSlider) spinSlider.value = b.spinRate || 2;
    if (spinSliderWrap) spinSliderWrap.style.display = (b.spinMode === 'off') ? 'none' : 'block';
    if (spinLabel) {
      const spinRateNames = ['', '0.5x Subtle', '1.0x Normal', '1.5x Lively', '2.0x Dynamic', '3.0x Hyper'];
      spinLabel.innerText = spinRateNames[b.spinRate || 2] || '1.0x Normal';
    }

    // If Atmo tab, sync its metric toggles and format/pace
    if (tabId === 'atmo') {
      window.syncAtmoMetricButtonsUI();
      window.syncAtmoDisplayFormatUI();
      window.syncAtmoTickerPaceUI();
    }

    // Sync inter-bubble collision and unit controls
    if (typeof window.syncInterBubbleCollisionUI === 'function') window.syncInterBubbleCollisionUI();
    if (typeof window.syncUnitUI === 'function') window.syncUnitUI();
  };

  window.setBubbleActive = function(isActive) {
    const b = window.nomadBubbles[window.currentSelectedBubbleTab];
    if (!b) return;
    b.active = !!isActive;
    window.setBubbleActiveUI(b.active);
    const statusDot = document.getElementById(`bubble-tab-status-${window.currentSelectedBubbleTab}`);
    if (statusDot) statusDot.classList.toggle('is-active', b.active);
    window.applyBubbleConfigUI(window.currentSelectedBubbleTab);
    window.saveBubbleConfig();
    if (typeof window.showMapThemeToast === 'function') {
      const meta = window.BUBBLE_METADATA[window.currentSelectedBubbleTab];
      window.showMapThemeToast({
        name: b.active ? `${meta.title} Bubble: Active (Visible)` : `${meta.title} Bubble: Inactive (Hidden)`,
        type: 'perspective'
      });
    }
  };

  window.setBubbleActiveUI = function(isActive) {
    const activeBtn = document.getElementById('bubble-status-active');
    const inactiveBtn = document.getElementById('bubble-status-inactive');
    if (activeBtn && inactiveBtn) {
      activeBtn.classList.toggle('is-selected', !!isActive);
      inactiveBtn.classList.toggle('is-selected', !isActive);
    }
  };

  window.setBubbleMotionMode = function(mode) {
    const b = window.nomadBubbles[window.currentSelectedBubbleTab];
    if (!b) return;
    b.mode = mode;
    window.setBubbleMotionModeUI(mode);
    window.applyBubbleConfigUI(window.currentSelectedBubbleTab);
    const isStationary = (mode === 'stationary');
    const safezoneGroup = document.getElementById('bubble-safezone-group');
    const safezoneTitle = document.getElementById('bubble-safezone-title');
    const wallGroup = document.getElementById('bubble-wall-group');
    const wallTitle = document.getElementById('bubble-wall-title');
    const speedSliderWrap = document.getElementById('bubble-speed-slider-wrap');
    if (safezoneGroup) safezoneGroup.style.display = isStationary ? 'none' : 'flex';
    if (safezoneTitle) safezoneTitle.style.display = isStationary ? 'none' : 'block';
    if (wallGroup) wallGroup.style.display = isStationary ? 'none' : 'flex';
    if (wallTitle) wallTitle.style.display = isStationary ? 'none' : 'block';
    if (speedSliderWrap) speedSliderWrap.style.display = isStationary ? 'none' : 'block';
    window.saveBubbleConfig();
  };

  window.setBubbleMotionModeUI = function(mode) {
    const kineticBtn = document.getElementById('bubble-mode-kinetic');
    const stationaryBtn = document.getElementById('bubble-mode-stationary');
    if (kineticBtn && stationaryBtn) {
      if (mode === 'kinetic') {
        kineticBtn.classList.add('is-selected');
        stationaryBtn.classList.remove('is-selected');
      } else {
        kineticBtn.classList.remove('is-selected');
        stationaryBtn.classList.add('is-selected');
      }
    }
  };

  window.setBubbleSafeZoneBehavior = function(behavior, applyToAll = false) {
    const tabId = window.currentSelectedBubbleTab;
    const b = window.nomadBubbles[tabId];
    if (!b) return;

    if (applyToAll) {
      window.BUBBLE_KEYS.forEach(k => {
        if (window.nomadBubbles[k]) {
          window.nomadBubbles[k].safeZoneBehavior = behavior;
        }
      });
    } else {
      b.safeZoneBehavior = behavior;
    }

    window.setBubbleSafeZoneBehaviorUI(behavior);
    window.applyBubbleConfigUI(tabId);
    window.saveBubbleConfig();

    if (navigator.vibrate) try { navigator.vibrate(25); } catch (_) {}
    if (typeof window.showMapThemeToast === 'function') {
      const title = (window.BUBBLE_METADATA && window.BUBBLE_METADATA[tabId]?.title) || tabId.toUpperCase();
      const msg = (behavior === 'under')
        ? (applyToAll ? '🌌 Glide Under: All Bubbles Pass Under Vehicle' : `🌌 Glide Under: ${title} Passes Under Vehicle`)
        : (applyToAll ? '🛡️ Safe Zone Deflect: All Bubbles Bounce' : `🛡️ Safe Zone Deflect: ${title} Bounces Off Forcefield`);
      window.showMapThemeToast({ name: msg, type: 'perspective' });
    }
  };

  window.applySafeZoneToAll = function() {
    const tabId = window.currentSelectedBubbleTab;
    const behavior = (window.nomadBubbles[tabId] && window.nomadBubbles[tabId].safeZoneBehavior) || 'bounce';
    window.setBubbleSafeZoneBehavior(behavior, true);
  };

  window.setBubbleSafeZoneBehaviorUI = function(behavior) {
    const bounceBtn = document.getElementById('bubble-safezone-bounce');
    const underBtn = document.getElementById('bubble-safezone-under');
    if (bounceBtn && underBtn) {
      if (behavior === 'under') {
        underBtn.classList.add('is-selected');
        bounceBtn.classList.remove('is-selected');
      } else {
        bounceBtn.classList.add('is-selected');
        underBtn.classList.remove('is-selected');
      }
    }
  };

  window.setBubbleWallBehavior = function(behavior, applyToAll = false) {
    const tabId = window.currentSelectedBubbleTab;
    const b = window.nomadBubbles[tabId];
    if (!b) return;

    if (applyToAll) {
      window.BUBBLE_KEYS.forEach(k => {
        if (window.nomadBubbles[k]) {
          window.nomadBubbles[k].wallBehavior = behavior;
        }
      });
    } else {
      b.wallBehavior = behavior;
    }

    window.setBubbleWallBehaviorUI(behavior);
    if (behavior === 'bounce') {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const size = b.size || 90;
      const topLimit = window.isLayoutInverted ? 88 : 64;
      const bottomLimit = window.isLayoutInverted ? (vh - 68) : (vh - 108);
      const leftLimit = 10;
      const rightLimit = vw - size - 10;
      if (b.x < leftLimit) b.x = leftLimit;
      if (b.x > rightLimit) b.x = rightLimit;
      if (b.y < topLimit) b.y = topLimit;
      if (b.y > bottomLimit) b.y = bottomLimit;
      window.applyBubbleConfigUI(tabId);
    }
    window.saveBubbleConfig();

    if (navigator.vibrate) try { navigator.vibrate(25); } catch (_) {}
    if (typeof window.showMapThemeToast === 'function') {
      const title = (window.BUBBLE_METADATA && window.BUBBLE_METADATA[tabId]?.title) || tabId.toUpperCase();
      const msg = (behavior === 'wrap')
        ? (applyToAll ? '🌀 Screen Wrap: All Bubbles Wrap Edges' : `🌀 Screen Wrap: ${title} Wraps Screen Edges`)
        : (applyToAll ? '🧱 Wall Barrier: All Bubbles Bounce Off Edges' : `🧱 Wall Barrier: ${title} Bounces Off Walls`);
      window.showMapThemeToast({ name: msg, type: 'perspective' });
    }
  };

  window.applyWallBehaviorToAll = function() {
    const tabId = window.currentSelectedBubbleTab;
    const behavior = (window.nomadBubbles[tabId] && window.nomadBubbles[tabId].wallBehavior) || 'bounce';
    window.setBubbleWallBehavior(behavior, true);
  };

  window.setBubbleWallBehaviorUI = function(behavior) {
    const bounceBtn = document.getElementById('bubble-wall-bounce');
    const wrapBtn = document.getElementById('bubble-wall-wrap');
    if (bounceBtn && wrapBtn) {
      bounceBtn.classList.toggle('is-selected', behavior === 'bounce');
      wrapBtn.classList.toggle('is-selected', behavior === 'wrap');
    }
  };

  window.setBubbleSize = function(sizePx) {
    const b = window.nomadBubbles[window.currentSelectedBubbleTab];
    if (!b) return;
    b.size = sizePx;
    window.setBubbleSizeUI(sizePx);
    const sizeSlider = document.getElementById('bubble-size-slider');
    if (sizeSlider) sizeSlider.value = sizePx;
    window.applyBubbleConfigUI(window.currentSelectedBubbleTab);
    window.saveBubbleConfig();
  };

  window.setBubbleSizeUI = function(sizePx) {
    const label = document.getElementById('bubble-size-val-label');
    let sizeName = '';
    if (sizePx <= 95) sizeName = ' (Compact)';
    else if (sizePx >= 145) sizeName = ' (Hero)';
    else sizeName = ' (Standard)';
    if (label) label.innerText = `${sizePx}px${sizeName}`;

    const btn90 = document.getElementById('bubble-size-opt-90');
    const btn125 = document.getElementById('bubble-size-opt-125');
    const btn160 = document.getElementById('bubble-size-opt-160');
    if (btn90 && btn125 && btn160) {
      btn90.classList.toggle('is-selected', sizePx <= 95);
      btn125.classList.toggle('is-selected', sizePx > 95 && sizePx < 145);
      btn160.classList.toggle('is-selected', sizePx >= 145);
    }
  };

  window.setBubbleShape = function(shape) {
    const b = window.nomadBubbles[window.currentSelectedBubbleTab];
    if (!b) return;
    b.shape = shape;
    window.setBubbleShapeUI(shape);
    window.applyBubbleConfigUI(window.currentSelectedBubbleTab);
    window.saveBubbleConfig();
  };

  window.setBubbleShapeUI = function(shape) {
    const buttons = document.querySelectorAll('#bubble-shape-picker .bubble-shape-btn');
    buttons.forEach(btn => {
      if (btn.getAttribute('data-shape') === shape) {
        btn.classList.add('is-selected');
      } else {
        btn.classList.remove('is-selected');
      }
    });
  };

  window.setBubbleColor = function(colorHex) {
    const b = window.nomadBubbles[window.currentSelectedBubbleTab];
    if (!b) return;
    b.color = colorHex;
    window.setBubbleColorUI(colorHex);
    window.applyBubbleConfigUI(window.currentSelectedBubbleTab);
    window.saveBubbleConfig();
  };

  window.setBubbleColorUI = function(colorHex) {
    const swatches = document.querySelectorAll('#bubble-color-picker .bubble-color-swatch');
    swatches.forEach(sw => {
      if (sw.getAttribute('data-color') === colorHex) {
        sw.classList.add('is-selected');
      } else {
        sw.classList.remove('is-selected');
      }
    });
  };

  window.onBubbleOpacitySliderChange = function(val) {
    const b = window.nomadBubbles[window.currentSelectedBubbleTab];
    if (!b) return;
    const num = parseInt(val, 10);
    b.opacity = num;
    const label = document.getElementById('bubble-opacity-val-label');
    if (label) {
      if (num === 0) {
        label.innerText = '0% Crystal Clear';
      } else if (num <= 25) {
        label.innerText = `${num}% Sheer Glass`;
      } else {
        label.innerText = `${num}% Frosted Tint`;
      }
    }
    window.applyBubbleConfigUI(window.currentSelectedBubbleTab);
    window.saveBubbleConfig();
  };

  window.onBubbleSizeSliderChange = function(val) {
    const b = window.nomadBubbles[window.currentSelectedBubbleTab];
    if (!b) return;
    const sizeInt = parseInt(val, 10);
    b.size = sizeInt;
    window.setBubbleSizeUI(sizeInt);
    window.applyBubbleConfigUI(window.currentSelectedBubbleTab);
    window.saveBubbleConfig();
  };

  window.onBubbleSpeedSliderChange = function(val) {
    const b = window.nomadBubbles[window.currentSelectedBubbleTab];
    if (!b) return;
    b.speedLevel = parseInt(val, 10);
    const label = document.getElementById('bubble-speed-val-label');
    const speedNames = ['', 'Gentle', 'Slow', 'Cruising Drift', 'Swift', 'Hyper'];
    if (label) label.innerText = speedNames[b.speedLevel] || 'Drift';
    window.saveBubbleConfig();
  };

  window.setBubbleSpinMode = function(mode) {
    const b = window.nomadBubbles[window.currentSelectedBubbleTab];
    if (!b) return;
    b.spinMode = mode;
    window.setBubbleSpinModeUI(mode);
    const spinSliderWrap = document.getElementById('bubble-spin-intensity-wrap');
    if (spinSliderWrap) spinSliderWrap.style.display = (mode === 'off') ? 'none' : 'block';
    if (mode === 'off') {
      b.currentRotation = 0;
      const shapeFrame = document.getElementById(`${window.currentSelectedBubbleTab}-bubble-shape-frame`);
      if (shapeFrame) shapeFrame.style.transform = 'rotate(0deg)';
    }
    window.applyBubbleConfigUI(window.currentSelectedBubbleTab);
    window.saveBubbleConfig();
  };

  window.setBubbleSpinModeUI = function(mode) {
    const keelBtn = document.getElementById('bubble-spin-keel');
    const offBtn = document.getElementById('bubble-spin-off');
    const gpsBtn = document.getElementById('bubble-spin-gps');
    const gyroBtn = document.getElementById('bubble-spin-gyro');
    if (keelBtn) keelBtn.classList.toggle('is-selected', mode === 'keel');
    if (offBtn) offBtn.classList.toggle('is-selected', mode === 'off');
    if (gpsBtn) gpsBtn.classList.toggle('is-selected', mode === 'gps');
    if (gyroBtn) gyroBtn.classList.toggle('is-selected', mode === 'gyro');
  };

  window.onBubbleSpinSliderChange = function(val) {
    const b = window.nomadBubbles[window.currentSelectedBubbleTab];
    if (!b) return;
    b.spinRate = parseInt(val, 10);
    const label = document.getElementById('bubble-spin-val-label');
    const spinRateNames = ['', '0.5x Subtle', '1.0x Normal', '1.5x Lively', '2.0x Dynamic', '3.0x Hyper'];
    if (label) label.innerText = spinRateNames[b.spinRate] || '1.0x Normal';
    window.saveBubbleConfig();
  };

  // Atmospheric Triad Sub-Selector Logic
  window.toggleAtmoMetric = function(metric) {
    const b = window.nomadBubbles.atmo;
    if (!b) return;
    if (metric === 'humidity') {
      b.showHumidity = !b.showHumidity;
    } else if (metric === 'uv') {
      b.showUv = !b.showUv;
    } else if (metric === 'pressure') {
      b.showPressure = !b.showPressure;
    }

    // Ensure at least one metric remains active so bubble never empties completely
    if (!b.showHumidity && !b.showUv && !b.showPressure) {
      b[metric === 'humidity' ? 'showHumidity' : (metric === 'uv' ? 'showUv' : 'showPressure')] = true;
    }

    window.syncAtmoMetricButtonsUI();
    window.applyBubbleConfigUI('atmo');
    window.renderAtmoBubble();
    window.startAtmoTickerTimer();
    window.saveBubbleConfig();
  };

  window.syncAtmoMetricButtonsUI = function() {
    const b = window.nomadBubbles.atmo;
    const humBtn = document.getElementById('atmo-btn-humidity');
    const uvBtn = document.getElementById('atmo-btn-uv');
    const pressBtn = document.getElementById('atmo-btn-pressure');

    if (humBtn) humBtn.classList.toggle('is-selected', b.showHumidity !== false);
    if (uvBtn) uvBtn.classList.toggle('is-selected', b.showUv !== false);
    if (pressBtn) pressBtn.classList.toggle('is-selected', b.showPressure !== false);
  };

  window.setAtmoDisplayFormat = function(format) {
    const b = window.nomadBubbles.atmo;
    if (!b) return;
    b.displayFormat = format;
    window.syncAtmoDisplayFormatUI();
    window.applyBubbleConfigUI('atmo');
    window.renderAtmoBubble();
    window.startAtmoTickerTimer();
    window.saveBubbleConfig();
  };

  window.setAtmoTickerPace = function(pace) {
    const b = window.nomadBubbles.atmo;
    if (!b) return;
    b.tickerSpeed = pace;
    window.syncAtmoTickerPaceUI();
    window.startAtmoTickerTimer();
    window.saveBubbleConfig();
  };

  window.syncAtmoDisplayFormatUI = function() {
    const b = window.nomadBubbles.atmo;
    const tickerBtn = document.getElementById('atmo-format-ticker');
    const stackBtn = document.getElementById('atmo-format-stack');
    const paceGroup = document.getElementById('atmo-ticker-pace-group');
    const isTicker = (b.displayFormat !== 'stack');
    if (tickerBtn) tickerBtn.classList.toggle('is-selected', isTicker);
    if (stackBtn) stackBtn.classList.toggle('is-selected', !isTicker);
    if (paceGroup) paceGroup.style.display = isTicker ? 'block' : 'none';
  };

  window.syncAtmoTickerPaceUI = function() {
    const b = window.nomadBubbles.atmo;
    const pace = b.tickerSpeed || 2.5;
    const fastBtn = document.getElementById('atmo-pace-fast');
    const steadyBtn = document.getElementById('atmo-pace-steady');
    const calmBtn = document.getElementById('atmo-pace-calm');
    if (fastBtn) fastBtn.classList.toggle('is-selected', pace === 1.5);
    if (steadyBtn) steadyBtn.classList.toggle('is-selected', pace === 2.5);
    if (calmBtn) calmBtn.classList.toggle('is-selected', pace === 4.0);
  };

  let atmoTickerIntervalId = null;
  window.startAtmoTickerTimer = function() {
    if (atmoTickerIntervalId) clearInterval(atmoTickerIntervalId);
    const b = window.nomadBubbles.atmo;
    if (!b) return;
    const intervalMs = Math.round(Math.max(1000, (b.tickerSpeed || 2.5) * 1000));
    atmoTickerIntervalId = setInterval(() => {
      const atmoB = window.nomadBubbles.atmo;
      if (!atmoB || atmoB.active === false || atmoB.displayFormat === 'stack') return;
      const activeMetrics = [
        atmoB.showHumidity !== false && 'humidity',
        atmoB.showUv !== false && 'uv',
        atmoB.showPressure !== false && 'pressure'
      ].filter(Boolean);
      if (activeMetrics.length <= 1) return;

      const hero = document.getElementById('atmo-ticker-hero');
      if (hero) hero.classList.add('atmo-ticker-transitioning');
      setTimeout(() => {
        atmoB.currentTickerIndex = ((atmoB.currentTickerIndex || 0) + 1) % activeMetrics.length;
        window.renderAtmoBubble();
        if (hero) hero.classList.remove('atmo-ticker-transitioning');
      }, 140);
    }, intervalMs);
  };

  // Resume ticker loop whenever the page or PWA is brought back to the foreground
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      if (typeof window.startAtmoTickerTimer === 'function') window.startAtmoTickerTimer();
      if (typeof window.renderAtmoBubble === 'function') window.renderAtmoBubble();
    }
  });

  // Telemetry Rendering Handlers for All 6 Bubbles
  window.renderSpeedBubble = function(speedText) {
    const valEl = document.getElementById('speed-bubble-value');
    if (!valEl) return;
    if (speedText !== undefined) valEl.innerText = String(speedText);
    const b = window.nomadBubbles && window.nomadBubbles.speed;
    if (b) {
      valEl.style.fontSize = window.calculateDynamicBubbleFontSize(
        valEl.innerText,
        b.size || 90,
        b.shape || 'circle',
        { maxScale: 0.42 }
      );
    }
  };

  window.renderCompassBubble = function(heading) {
    const el = document.getElementById('compass-bubble-value');
    if (!el) return;
    let h = (typeof heading === 'number' && !isNaN(heading))
      ? heading
      : ((typeof window.currentHeading === 'number' && !isNaN(window.currentHeading) && window.currentHeading !== 0)
        ? window.currentHeading
        : (window.map && typeof window.map.getBearing === 'function' ? ((window.map.getBearing() % 360 + 360) % 360) : 0));
    
    const valText = `${Math.round(h)}°`;
    el.innerText = valText;

    // Rotate authentic magnetic compass needle
    const needle = document.getElementById('compass-bubble-needle');
    if (needle) {
      needle.style.transform = `rotate(${h.toFixed(1)}deg)`;
    }

    // Update cardinal heading label (N, NE, E, SE, S, SW, W, NW)
    const cardEl = document.getElementById('compass-bubble-cardinal');
    if (cardEl) {
      const getCard = (typeof window.getCardinalDirection === 'function')
        ? window.getCardinalDirection
        : (a => ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round((a || 0) / 45) % 8]);
      cardEl.innerText = getCard(h);
    }

    const b = window.nomadBubbles && window.nomadBubbles.compass;
    if (b) {
      el.style.fontSize = window.calculateDynamicBubbleFontSize(
        valText,
        b.size || 90,
        b.shape || 'circle',
        { maxScale: 0.36 }
      );
    }
  };

  window.renderAltitudeBubble = function(altMeters) {
    const el = document.getElementById('altitude-bubble-value');
    if (!el) return;
    const meters = (typeof altMeters === 'number') ? altMeters : window.rawAltitudeMeters;
    if (meters === null || isNaN(meters)) {
      el.innerText = '--';
    } else {
      const isM = (window.altitudeUnit === 'm');
      el.innerText = isM ? Math.round(meters).toLocaleString() : Math.round(meters * 3.28084).toLocaleString();
    }
    const b = window.nomadBubbles && window.nomadBubbles.altitude;
    if (b) {
      el.style.fontSize = window.calculateDynamicBubbleFontSize(
        el.innerText,
        b.size || 90,
        b.shape || 'egg',
        { maxScale: 0.40 }
      );
    }
  };

  window.renderTemperatureBubble = function() {
    const el = document.getElementById('temp-bubble-value');
    if (!el) return;
    if (window.rawTempF === null || isNaN(window.rawTempF)) {
      el.innerText = '--°';
    } else if (window.isFahrenheit) {
      el.innerText = `${Math.round(window.rawTempF)}°`;
    } else {
      const tempC = (window.rawTempF - 32) * (5 / 9);
      el.innerText = `${Math.round(tempC)}°`;
    }
    const b = window.nomadBubbles && window.nomadBubbles.temp;
    if (b) {
      el.style.fontSize = window.calculateDynamicBubbleFontSize(
        el.innerText,
        b.size || 90,
        b.shape || 'circle',
        { maxScale: 0.40 }
      );
    }
  };

  window.renderAtmoBubble = function() {
    const b = window.nomadBubbles && window.nomadBubbles.atmo;
    if (!b) return;

    const isTicker = (b.displayFormat !== 'stack');
    const tickerHero = document.getElementById('atmo-ticker-hero');
    const stack = document.getElementById('atmo-stack-inner');

    if (tickerHero) tickerHero.style.display = isTicker ? 'flex' : 'none';
    if (stack) stack.style.display = isTicker ? 'none' : 'flex';

    // Robustly read telemetry from memory, window, or localStorage cache
    let rawHum = (window.rawHumidityPercent !== null && window.rawHumidityPercent !== undefined && !isNaN(Number(window.rawHumidityPercent)))
      ? Number(window.rawHumidityPercent) : null;
    let rawUv = (window.rawUvIndex !== null && window.rawUvIndex !== undefined && !isNaN(Number(window.rawUvIndex)))
      ? Number(window.rawUvIndex) : null;
    let rawPress = (window.rawPressureHpa !== null && window.rawPressureHpa !== undefined && !isNaN(Number(window.rawPressureHpa)))
      ? Number(window.rawPressureHpa) : null;

    if (rawHum === null || rawUv === null || rawPress === null) {
      try {
        const cachedW = localStorage.getItem('nomad_v4_weather_cache');
        if (cachedW) {
          const cw = JSON.parse(cachedW);
          if (cw && typeof cw === 'object') {
            if (rawHum === null && cw.humidity !== undefined && !isNaN(Number(cw.humidity))) rawHum = Number(cw.humidity);
            if (rawUv === null && cw.uv !== undefined && !isNaN(Number(cw.uv))) rawUv = Number(cw.uv);
            if (rawPress === null && cw.pressureHpa !== undefined && !isNaN(Number(cw.pressureHpa))) rawPress = Number(cw.pressureHpa);
          }
        }
      } catch (_) {}
    }

    const humStr = (rawHum !== null) ? `${Math.round(rawHum)}%` : '--%';
    let uvStr = 'UV --';
    let uvHeroVal = '--';
    if (rawUv !== null) {
      const formattedUv = (rawUv % 1 === 0) ? rawUv.toFixed(0) : rawUv.toFixed(1);
      uvStr = `UV ${formattedUv}`;
      uvHeroVal = formattedUv;
    }

    let pressStr = '--';
    let pressInHg = '--';
    let pressHpa = '--';
    if (rawPress !== null) {
      const unit = window.customPressureUnit ? window.customPressureUnit : (window.isFahrenheit ? 'in' : 'hPa');
      if (unit === 'in') {
        pressInHg = (rawPress * 0.02953).toFixed(2);
        pressStr = `${pressInHg}in`;
      } else {
        pressHpa = String(Math.round(rawPress));
        pressStr = `${pressHpa}hPa`;
      }
    }

    if (isTicker) {
      const tickerVal = document.getElementById('atmo-ticker-value');
      const tickerLbl = document.getElementById('atmo-ticker-label');
      if (!tickerVal || !tickerLbl) return;

      const activeMetrics = [
        b.showHumidity !== false && 'humidity',
        b.showUv !== false && 'uv',
        b.showPressure !== false && 'pressure'
      ].filter(Boolean);
      if (activeMetrics.length === 0) activeMetrics.push('humidity');

      const currentMetric = activeMetrics[(b.currentTickerIndex || 0) % activeMetrics.length] || 'humidity';

      if (currentMetric === 'humidity') {
        tickerVal.innerText = humStr;
        tickerLbl.innerHTML = '<span>💧</span> <span>HUMIDITY</span>';
      } else if (currentMetric === 'uv') {
        tickerVal.innerText = uvHeroVal;
        tickerLbl.innerHTML = '<span>☀️</span> <span>UV INDEX</span>';
      } else if (currentMetric === 'pressure') {
        const unit = window.customPressureUnit ? window.customPressureUnit : (window.isFahrenheit ? 'in' : 'hPa');
        if (unit === 'in') {
          tickerVal.innerHTML = `<span class="atmo-val-num">${pressInHg}</span><span class="atmo-val-unit">in</span>`;
        } else {
          tickerVal.innerHTML = `<span class="atmo-val-num">${pressHpa}</span><span class="atmo-val-unit">hPa</span>`;
        }
        tickerLbl.innerHTML = '<span>⏲️</span> <span>BAROMETER</span>';
      }

      // Dynamic text sizing for tickerVal and tickerLbl based on live value length, bubble size, and shape
      const curSize = b.size || 95;
      const textToMeasure = tickerVal.textContent || '';
      tickerVal.style.fontSize = window.calculateDynamicBubbleFontSize(
        textToMeasure,
        curSize,
        b.shape || 'squirkle',
        { maxScale: 0.35, hasSubLabel: true }
      );
      tickerLbl.style.fontSize = `${Math.max(7.5, curSize * 0.088).toFixed(1)}px`;

      // Update notched shape unit label on SVG if rendered
      const shapeFrame = document.getElementById('atmo-bubble-shape-frame');
      if (shapeFrame) {
        const texts = shapeFrame.querySelectorAll('text');
        if (texts && texts.length > 0) {
          texts[0].textContent = (currentMetric === 'humidity') ? 'HUM' : ((currentMetric === 'uv') ? 'UV' : 'BARO');
        }
      }
    } else {
      const humRow = document.getElementById('atmo-row-humidity');
      const uvRow = document.getElementById('atmo-row-uv');
      const pressRow = document.getElementById('atmo-row-pressure');
      const humVal = document.getElementById('atmo-val-humidity');
      const uvVal = document.getElementById('atmo-val-uv');
      const pressVal = document.getElementById('atmo-val-pressure');

      if (humRow) humRow.style.display = (b.showHumidity !== false) ? 'flex' : 'none';
      if (uvRow) uvRow.style.display = (b.showUv !== false) ? 'flex' : 'none';
      if (pressRow) pressRow.style.display = (b.showPressure !== false) ? 'flex' : 'none';

      if (humVal) humVal.innerText = humStr;
      if (uvVal) uvVal.innerText = uvStr;
      if (pressVal) pressVal.innerText = pressStr;

      const curSize = b.size || 95;
      const stack = document.getElementById('atmo-stack-inner');
      if (stack) stack.style.fontSize = `${Math.max(9.0, curSize * 0.125).toFixed(1)}px`;

      const shapeFrame = document.getElementById('atmo-bubble-shape-frame');
      if (shapeFrame) {
        const texts = shapeFrame.querySelectorAll('text');
        if (texts && texts.length > 0) {
          texts[0].textContent = 'AIR';
        }
      }
    }
  };

  window.renderCoordsBubble = function(lat, lon) {
    const latEl = document.getElementById('coords-lat');
    const lonEl = document.getElementById('coords-lon');
    if (!latEl || !lonEl) return;

    const actualLat = (typeof lat === 'number' && !isNaN(lat)) ? lat : window.lastLat;
    const actualLon = (typeof lon === 'number' && !isNaN(lon)) ? lon : window.lastLon;

    if (actualLat === null || actualLon === null || isNaN(actualLat) || isNaN(actualLon)) {
      latEl.innerText = '--.---° N';
      lonEl.innerText = '--.---° W';
    } else {
      const latAbs = Math.abs(actualLat).toFixed(3);
      const latDir = actualLat >= 0 ? 'N' : 'S';
      latEl.innerText = `${latAbs}° ${latDir}`;

      const lonAbs = Math.abs(actualLon).toFixed(3);
      const lonDir = actualLon >= 0 ? 'E' : 'W';
      lonEl.innerText = `${lonAbs}° ${lonDir}`;
    }

    const b = window.nomadBubbles && window.nomadBubbles.coords;
    if (b) {
      const s = b.size || 90;
      const fs = window.calculateDynamicBubbleFontSize(latEl.innerText, s, b.shape || 'square', {
        maxScale: 0.13,
        minPx: 8.5
      });
      latEl.style.fontSize = fs;
      lonEl.style.fontSize = fs;
    }
  };

  // Inter-Bubble Collision Mode (Pinball Bounce vs Ghost Mode)
  window.setInterBubbleCollision = function(mode) {
    if (!window.nomadBubbleGlobalSettings) window.nomadBubbleGlobalSettings = {};
    window.nomadBubbleGlobalSettings.interBubbleCollision = mode;
    localStorage.setItem('nomad_v4_bubble_globals', JSON.stringify(window.nomadBubbleGlobalSettings));
    window.syncInterBubbleCollisionUI();

    if (navigator.vibrate) try { navigator.vibrate(25); } catch (_) {}
    if (typeof window.showMapThemeToast === 'function') {
      window.showMapThemeToast({
        name: (mode === 'ghost')
          ? '👻 Ghost Mode Active: Bubbles Pass Through Each Other'
          : '⚡ Pinball Bounce Active: Elastic Inter-Bubble Collision',
        type: 'perspective'
      });
    }
  };

  window.syncInterBubbleCollisionUI = function() {
    const mode = (window.nomadBubbleGlobalSettings && window.nomadBubbleGlobalSettings.interBubbleCollision) || 'bounce';
    const bounceBtn = document.getElementById('bubble-interact-bounce');
    const ghostBtn = document.getElementById('bubble-interact-ghost');
    if (bounceBtn) bounceBtn.classList.toggle('is-selected', mode === 'bounce');
    if (ghostBtn) ghostBtn.classList.toggle('is-selected', mode === 'ghost');

    const keys = window.BUBBLE_KEYS || [];
    keys.forEach(k => {
      const el = document.getElementById(`${k}-bubble`);
      if (el) el.classList.toggle('is-ghost-mode', mode === 'ghost');
    });
  };

  // Measurement Units Management (Imperial vs Metric)
  window.syncUnitUI = function() {
    const tabId = window.currentSelectedBubbleTab;
    const titleEl = document.getElementById('bubble-units-title');
    const opt1 = document.getElementById('bubble-unit-opt-1');
    const opt2 = document.getElementById('bubble-unit-opt-2');
    const group = document.getElementById('bubble-units-active-group');

    if (!opt1 || !opt2 || !group) return;

    if (tabId === 'speed') {
      group.style.display = 'flex';
      if (titleEl) titleEl.innerText = 'Speed Measurement Unit';
      opt1.innerText = 'MPH (Imperial)';
      opt2.innerText = 'KM/H (Metric)';
      opt1.classList.toggle('is-selected', window.isMph !== false);
      opt2.classList.toggle('is-selected', window.isMph === false);
    } else if (tabId === 'temp') {
      group.style.display = 'flex';
      if (titleEl) titleEl.innerText = 'Temperature Measurement Unit';
      opt1.innerText = '°F Fahrenheit';
      opt2.innerText = '°C Celsius';
      opt1.classList.toggle('is-selected', window.isFahrenheit !== false);
      opt2.classList.toggle('is-selected', window.isFahrenheit === false);
    } else if (tabId === 'altitude') {
      group.style.display = 'flex';
      if (titleEl) titleEl.innerText = 'Altitude Measurement Unit';
      opt1.innerText = 'Feet (FT)';
      opt2.innerText = 'Meters (M)';
      const isM = (window.altitudeUnit === 'm');
      opt1.classList.toggle('is-selected', !isM);
      opt2.classList.toggle('is-selected', isM);
    } else if (tabId === 'atmo') {
      group.style.display = 'flex';
      if (titleEl) titleEl.innerText = 'Barometer Measurement Unit';
      opt1.innerText = 'inHg (in)';
      opt2.innerText = 'hPa / mbar';
      const isHpa = (window.customPressureUnit === 'hPa' || (!window.customPressureUnit && !window.isFahrenheit));
      opt1.classList.toggle('is-selected', !isHpa);
      opt2.classList.toggle('is-selected', isHpa);
    } else {
      group.style.display = 'none';
      if (titleEl) titleEl.innerText = 'System Measurement Units';
    }

    // Sync Global Unit Pill buttons
    const btnImp = document.getElementById('btn-global-imperial');
    const btnMet = document.getElementById('btn-global-metric');
    const isAllImp = (window.isMph !== false && window.isFahrenheit !== false && window.altitudeUnit !== 'm' && window.customPressureUnit !== 'hPa');
    const isAllMet = (window.isMph === false && window.isFahrenheit === false && window.altitudeUnit === 'm' && window.customPressureUnit === 'hPa');
    if (btnImp) btnImp.classList.toggle('is-selected', isAllImp);
    if (btnMet) btnMet.classList.toggle('is-selected', isAllMet);
  };

  window.toggleActiveBubbleUnit = function(optionIndex) {
    const tabId = window.currentSelectedBubbleTab;
    let toastName = '';
    if (tabId === 'speed') {
      window.isMph = (optionIndex === 1);
      toastName = window.isMph ? 'Speed Unit: MPH' : 'Speed Unit: KM/H';
      window.applyBubbleConfigUI('speed');
      if (typeof window.updateSpeedometer === 'function') window.updateSpeedometer();
    } else if (tabId === 'temp') {
      window.isFahrenheit = (optionIndex === 1);
      toastName = window.isFahrenheit ? 'Temp Unit: °F' : 'Temp Unit: °C';
      window.applyBubbleConfigUI('temp');
      window.renderTemperatureBubble();
      if (typeof window.updateWeatherDisplay === 'function') window.updateWeatherDisplay();
    } else if (tabId === 'altitude') {
      window.altitudeUnit = (optionIndex === 1) ? 'ft' : 'm';
      toastName = (window.altitudeUnit === 'ft') ? 'Altitude Unit: Feet (FT)' : 'Altitude Unit: Meters (M)';
      localStorage.setItem('nomad_v4_altitude_unit', window.altitudeUnit);
      window.applyBubbleConfigUI('altitude');
      window.renderAltitudeBubble();
    } else if (tabId === 'atmo') {
      window.customPressureUnit = (optionIndex === 1) ? 'in' : 'hPa';
      toastName = (window.customPressureUnit === 'in') ? 'Barometer Unit: inHg' : 'Barometer Unit: hPa / mbar';
      window.applyBubbleConfigUI('atmo');
      window.renderAtmoBubble();
      if (typeof window.updateWeatherDisplay === 'function') window.updateWeatherDisplay();
    }
    window.syncUnitUI();
    window.saveBubbleConfig();

    if (navigator.vibrate) try { navigator.vibrate(25); } catch (_) {}
    if (toastName && typeof window.showMapThemeToast === 'function') {
      window.showMapThemeToast({ name: toastName, type: 'perspective' });
    }
  };

  window.setGlobalUnitSystem = function(system) {
    const isImperial = (system === 'imperial');
    window.isMph = isImperial;
    window.isFahrenheit = isImperial;
    window.altitudeUnit = isImperial ? 'ft' : 'm';
    localStorage.setItem('nomad_v4_altitude_unit', window.altitudeUnit);
    window.customPressureUnit = isImperial ? 'in' : 'hPa';

    if (!window.nomadBubbleGlobalSettings) window.nomadBubbleGlobalSettings = {};
    window.nomadBubbleGlobalSettings.globalUnitSystem = system;
    localStorage.setItem('nomad_v4_bubble_globals', JSON.stringify(window.nomadBubbleGlobalSettings));

    window.applyBubbleConfigUI('speed');
    window.applyBubbleConfigUI('temp');
    window.applyBubbleConfigUI('altitude');
    window.applyBubbleConfigUI('atmo');

    if (typeof window.updateSpeedometer === 'function') window.updateSpeedometer();
    window.renderTemperatureBubble();
    window.renderAltitudeBubble();
    window.renderAtmoBubble();
    if (typeof window.updateWeatherDisplay === 'function') window.updateWeatherDisplay();

    window.syncUnitUI();
    window.saveBubbleConfig();

    // In-modal visual confirmation badge
    const feedback = document.getElementById('global-unit-feedback');
    if (feedback) {
      feedback.innerText = isImperial ? '✓ Imperial Active' : '✓ Metric Active';
      feedback.style.opacity = '1';
      clearTimeout(window._unitFeedbackTimeout);
      window._unitFeedbackTimeout = setTimeout(() => {
        if (feedback) feedback.style.opacity = '0';
      }, 2400);
    }

    if (navigator.vibrate) try { navigator.vibrate(30); } catch (_) {}
    if (typeof window.showMapThemeToast === 'function') {
      window.showMapThemeToast({
        name: isImperial ? 'Telemetry Units: All Imperial (MPH, °F, FT, inHg)' : 'Telemetry Units: All Metric (KM/H, °C, M, hPa)',
        type: 'perspective'
      });
    }
  };

})();
