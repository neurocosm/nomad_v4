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
      showHumidity: true, showUv: true, showPressure: true
    },
    coords: {
      key: 'coords', active: true, shape: 'square', color: '#ffffff', opacity: 18, size: 95,
      mode: 'kinetic', wallBehavior: 'bounce', safeZoneBehavior: 'bounce',
      spinMode: 'keel', spinRate: 2, currentRotation: 0, angularVelocity: 0, keelTime: 5.5,
      speedLevel: 3, x: 230, y: 490, vx: -0.65, vy: -0.90, isDragging: false, isHovered: false
    }
  };

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
    if (typeof window.renderTemperature === 'function') window.renderTemperature();
    if (typeof window.renderAtmoBubble === 'function') window.renderAtmoBubble();
    if (window.lastLat !== null && window.lastLon !== null && typeof window.renderCoordsBubble === 'function') {
      window.renderCoordsBubble(window.lastLat, window.lastLon);
    }

    // 5. Start unified kinetic physics animation loop
    window.startKineticBubbleLoop();
  };

  /**
   * Generates mathematical SVG vector markup with notched typography for each geometric shape
   */
  window.getBubbleShapeSVGMarkup = function(shape, hex, fill, channelLabel = 'SPEED', unitLabel = null) {
    const strokeW = 2.4;
    const strokeJoin = 'round';
    const strokeCap = 'round';
    if (!unitLabel) {
      unitLabel = (typeof window.isMph !== 'undefined' && !window.isMph) ? 'KM/H' : 'MPH';
    }
    const labelFontSize = (shape === 'octagon') ? '8.4' : '8.8';

    switch (shape) {
      case 'triangle':
        return `
          <polygon points="50,6 88.1,72 11.9,72" fill="${fill}" stroke="none"/>
          <path d="M 56.6,17.5 L 88.1,72 L 68,72" fill="none" stroke="${hex}" stroke-width="${strokeW}" stroke-linejoin="${strokeJoin}" stroke-linecap="${strokeCap}"/>
          <path d="M 32,72 L 11.9,72 L 43.4,17.5" fill="none" stroke="${hex}" stroke-width="${strokeW}" stroke-linejoin="${strokeJoin}" stroke-linecap="${strokeCap}"/>
          <text x="50" y="10.5" text-anchor="middle" dominant-baseline="central" fill="${hex}" font-size="${labelFontSize}" font-weight="700" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" letter-spacing="1.2">${unitLabel}</text>
          <text x="50" y="72" text-anchor="middle" dominant-baseline="central" fill="${hex}" font-size="${labelFontSize}" font-weight="700" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" letter-spacing="1.2">${channelLabel}</text>
        `;

      case 'square':
        return `
          <rect x="11" y="11" width="78" height="78" rx="12" fill="${fill}" stroke="none"/>
          <path d="M 69,11 L 77,11 A 12 12 0 0 1 89,23 L 89,77 A 12 12 0 0 1 77,89 L 69,89" fill="none" stroke="${hex}" stroke-width="${strokeW}" stroke-linejoin="${strokeJoin}" stroke-linecap="${strokeCap}"/>
          <path d="M 31,89 L 23,89 A 12 12 0 0 1 11,77 L 11,23 A 12 12 0 0 1 23,11 L 31,11" fill="none" stroke="${hex}" stroke-width="${strokeW}" stroke-linejoin="${strokeJoin}" stroke-linecap="${strokeCap}"/>
          <text x="50" y="11" text-anchor="middle" dominant-baseline="central" fill="${hex}" font-size="${labelFontSize}" font-weight="700" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" letter-spacing="1.2">${unitLabel}</text>
          <text x="50" y="89" text-anchor="middle" dominant-baseline="central" fill="${hex}" font-size="${labelFontSize}" font-weight="700" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" letter-spacing="1.2">${channelLabel}</text>
        `;

      case 'squirkle':
        return `
          <rect x="9" y="9" width="82" height="82" rx="20" fill="${fill}" stroke="none"/>
          <path d="M 68,9 L 71,9 A 20 20 0 0 1 91,29 L 91,71 A 20 20 0 0 1 71,91 L 68,91" fill="none" stroke="${hex}" stroke-width="${strokeW}" stroke-linejoin="${strokeJoin}" stroke-linecap="${strokeCap}"/>
          <path d="M 32,91 L 29,91 A 20 20 0 0 1 9,71 L 9,29 A 20 20 0 0 1 29,9 L 32,9" fill="none" stroke="${hex}" stroke-width="${strokeW}" stroke-linejoin="${strokeJoin}" stroke-linecap="${strokeCap}"/>
          <text x="50" y="9" text-anchor="middle" dominant-baseline="central" fill="${hex}" font-size="${labelFontSize}" font-weight="700" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" letter-spacing="1.2">${unitLabel}</text>
          <text x="50" y="91" text-anchor="middle" dominant-baseline="central" fill="${hex}" font-size="${labelFontSize}" font-weight="700" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" letter-spacing="1.2">${channelLabel}</text>
        `;

      case 'hexagon':
        return `
          <polygon points="28,11.9 72,11.9 94,50 72,88.1 28,88.1 6,50" fill="${fill}" stroke="none"/>
          <path d="M 68,11.9 L 72,11.9 L 94,50 L 72,88.1 L 68,88.1" fill="none" stroke="${hex}" stroke-width="${strokeW}" stroke-linejoin="${strokeJoin}" stroke-linecap="${strokeCap}"/>
          <path d="M 32,88.1 L 28,88.1 L 6,50 L 28,11.9 L 32,11.9" fill="none" stroke="${hex}" stroke-width="${strokeW}" stroke-linejoin="${strokeJoin}" stroke-linecap="${strokeCap}"/>
          <text x="50" y="11.9" text-anchor="middle" dominant-baseline="central" fill="${hex}" font-size="${labelFontSize}" font-weight="700" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" letter-spacing="1.2">${unitLabel}</text>
          <text x="50" y="88.1" text-anchor="middle" dominant-baseline="central" fill="${hex}" font-size="${labelFontSize}" font-weight="700" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" letter-spacing="1.2">${channelLabel}</text>
        `;

      case 'octagon':
        return `
          <polygon points="33.2,9.4 66.8,9.4 90.6,33.2 90.6,66.8 66.8,90.6 33.2,90.6 9.4,66.8 9.4,33.2" fill="${fill}" stroke="none"/>
          <path d="M 66.8,9.4 L 90.6,33.2 L 90.6,66.8 L 66.8,90.6" fill="none" stroke="${hex}" stroke-width="${strokeW}" stroke-linejoin="${strokeJoin}" stroke-linecap="${strokeCap}"/>
          <path d="M 33.2,90.6 L 9.4,66.8 L 9.4,33.2 L 33.2,9.4" fill="none" stroke="${hex}" stroke-width="${strokeW}" stroke-linejoin="${strokeJoin}" stroke-linecap="${strokeCap}"/>
          <text x="50" y="9.4" text-anchor="middle" dominant-baseline="central" fill="${hex}" font-size="${labelFontSize}" font-weight="700" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" letter-spacing="1.1">${unitLabel}</text>
          <text x="50" y="90.6" text-anchor="middle" dominant-baseline="central" fill="${hex}" font-size="${labelFontSize}" font-weight="700" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" letter-spacing="1.1">${channelLabel}</text>
        `;

      case 'pentagon':
        return `
          <polygon points="50,6 91.8,36.4 75.9,85.6 24.1,85.6 8.2,36.4" fill="${fill}" stroke="none"/>
          <path d="M 63.7,16 L 91.8,36.4 L 75.9,85.6 L 68,85.6" fill="none" stroke="${hex}" stroke-width="${strokeW}" stroke-linejoin="${strokeJoin}" stroke-linecap="${strokeCap}"/>
          <path d="M 32,85.6 L 24.1,85.6 L 8.2,36.4 L 36.3,16" fill="none" stroke="${hex}" stroke-width="${strokeW}" stroke-linejoin="${strokeJoin}" stroke-linecap="${strokeCap}"/>
          <text x="50" y="10" text-anchor="middle" dominant-baseline="central" fill="${hex}" font-size="${labelFontSize}" font-weight="700" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" letter-spacing="1.2">${unitLabel}</text>
          <text x="50" y="85.6" text-anchor="middle" dominant-baseline="central" fill="${hex}" font-size="${labelFontSize}" font-weight="700" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" letter-spacing="1.2">${channelLabel}</text>
        `;

      case 'egg':
        return `
          <path d="M 50,7 C 74,7 94,14 94,34 C 94,62 84,84 70,88 L 30,88 C 16,84 6,62 6,34 C 6,14 26,7 50,7 Z" fill="${fill}" stroke="none"/>
          <path d="M 68,8 C 76,8 94,14 94,34 C 94,62 84,84 70,88" fill="none" stroke="${hex}" stroke-width="${strokeW}" stroke-linejoin="${strokeJoin}" stroke-linecap="${strokeCap}"/>
          <path d="M 30,88 C 16,84 6,62 6,34 C 6,14 24,8 32,8" fill="none" stroke="${hex}" stroke-width="${strokeW}" stroke-linejoin="${strokeJoin}" stroke-linecap="${strokeCap}"/>
          <text x="50" y="8" text-anchor="middle" dominant-baseline="central" fill="${hex}" font-size="${labelFontSize}" font-weight="700" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" letter-spacing="1.2">${unitLabel}</text>
          <text x="50" y="88" text-anchor="middle" dominant-baseline="central" fill="${hex}" font-size="${labelFontSize}" font-weight="700" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" letter-spacing="1.2">${channelLabel}</text>
        `;

      case 'circle':
      default:
        return `
          <circle cx="50" cy="50" r="44" fill="${fill}" stroke="none"/>
          <path d="M 70,10.8 A 44 44 0 0 1 70,89.2" fill="none" stroke="${hex}" stroke-width="${strokeW}" stroke-linejoin="${strokeJoin}" stroke-linecap="${strokeCap}"/>
          <path d="M 30,89.2 A 44 44 0 0 1 30,10.8" fill="none" stroke="${hex}" stroke-width="${strokeW}" stroke-linejoin="${strokeJoin}" stroke-linecap="${strokeCap}"/>
          <text x="50" y="10.8" text-anchor="middle" dominant-baseline="central" fill="${hex}" font-size="${labelFontSize}" font-weight="700" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" letter-spacing="1.2">${unitLabel}</text>
          <text x="50" y="89.2" text-anchor="middle" dominant-baseline="central" fill="${hex}" font-size="${labelFontSize}" font-weight="700" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" letter-spacing="1.2">${channelLabel}</text>
        `;
    }
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
    let unitLabel = (typeof window.isMph !== 'undefined' && !window.isMph) ? 'KM/H' : 'MPH';

    if (bubbleKey === 'compass') {
      channelLabel = 'HEADING';
      unitLabel = (typeof window.currentHeading === 'number' && !isNaN(window.currentHeading) && typeof window.getCardinalDirection === 'function') 
        ? window.getCardinalDirection(window.currentHeading) : 'N';
    } else if (bubbleKey === 'altitude') {
      channelLabel = 'ALTITUDE';
      unitLabel = 'FT';
    } else if (bubbleKey === 'temp') {
      channelLabel = 'TEMP';
      unitLabel = window.isFahrenheit ? '°F' : '°C';
    } else if (bubbleKey === 'atmo') {
      channelLabel = 'ATMO';
      unitLabel = 'AIR';
    } else if (bubbleKey === 'coords') {
      channelLabel = 'COORDS';
      unitLabel = 'GPS';
    }

    if (shapeFrame) {
      shapeFrame.innerHTML = `<svg viewBox="0 0 100 100" class="kinetic-shape-svg" style="width:100%;height:100%;overflow:visible;display:block;filter:none;">${window.getBubbleShapeSVGMarkup(b.shape, hex, fill, channelLabel, unitLabel)}</svg>`;
      shapeFrame.style.border = 'none';
      shapeFrame.style.background = 'transparent';
      shapeFrame.style.outline = 'none';
      shapeFrame.style.boxShadow = 'none';
      shapeFrame.style.transform = `rotate(${b.currentRotation || 0}deg)`;
    }

    // Font size scaling based on bubble dimension
    if (bubbleKey === 'speed' || bubbleKey === 'compass' || bubbleKey === 'altitude' || bubbleKey === 'temp') {
      const valEl = document.getElementById(`${bubbleKey}-bubble-value`);
      if (valEl) {
        valEl.style.fontSize = `${(size * 0.44).toFixed(1)}px`;
      }
    } else if (bubbleKey === 'atmo') {
      const stack = document.getElementById('atmo-stack-inner');
      if (stack) {
        stack.style.fontSize = `${Math.max(9.5, size * 0.135).toFixed(1)}px`;
      }
    } else if (bubbleKey === 'coords') {
      const cLines = document.querySelectorAll('#coords-bubble-content .coords-line');
      cLines.forEach(cl => {
        cl.style.fontSize = `${Math.max(9.5, size * 0.13).toFixed(1)}px`;
      });
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
      if (b.x > vw) {
        b.x = -size;
      } else if (b.x < -size) {
        b.x = vw;
      }

      if (b.y > vh) {
        b.y = -size;
      } else if (b.y < -size) {
        b.y = vh;
      }
    } else {
      const topLimit = window.isLayoutInverted ? 88 : 64;
      const bottomLimit = window.isLayoutInverted ? (vh - 68) : (vh - 108);
      const leftLimit = 10;
      const rightLimit = vw - size - 10;

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
        }
      }
    }

    el.style.left = `${b.x}px`;
    el.style.top = `${b.y}px`;
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
      }
    }

    // Touch events
    el.addEventListener('touchstart', (e) => {
      b.isHovered = true; // freeze on finger contact
      if (e.touches.length === 1) {
        onPointerDown(e.touches[0].clientX, e.touches[0].clientY, e);
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (b.isDragging || state.longPressTimer) {
        if (e.touches.length === 1) {
          onPointerMove(e.touches[0].clientX, e.touches[0].clientY, e);
        }
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      b.isHovered = false;
      onPointerUp();
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
    if (!window.BUBBLE_KEYS.includes(tabId)) return;
    window.currentSelectedBubbleTab = tabId;

    // 1. Update tab buttons active states and status indicators
    window.BUBBLE_KEYS.forEach(k => {
      const tabBtn = document.getElementById(`bubble-tab-${k}`);
      if (tabBtn) tabBtn.classList.toggle('is-active', k === tabId);
      const statusDot = document.getElementById(`bubble-tab-status-${k}`);
      if (statusDot) statusDot.classList.toggle('is-active', window.nomadBubbles[k].active !== false);
    });

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

    // If Atmo tab, sync its metric toggles
    if (tabId === 'atmo') {
      window.syncAtmoMetricButtonsUI();
    }
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

  window.setBubbleSafeZoneBehavior = function(behavior) {
    const b = window.nomadBubbles[window.currentSelectedBubbleTab];
    if (!b) return;
    b.safeZoneBehavior = behavior;
    window.setBubbleSafeZoneBehaviorUI(behavior);
    window.saveBubbleConfig();
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

  window.setBubbleWallBehavior = function(behavior) {
    const b = window.nomadBubbles[window.currentSelectedBubbleTab];
    if (!b) return;
    b.wallBehavior = behavior;
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
      window.applyBubbleConfigUI(window.currentSelectedBubbleTab);
    }
    window.saveBubbleConfig();
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
    window.renderAtmoBubble();
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

  // Telemetry Rendering Handlers for All 6 Bubbles
  window.renderCompassBubble = function(heading) {
    const el = document.getElementById('compass-bubble-value');
    if (!el) return;
    if (heading === null || isNaN(heading)) {
      el.innerText = '--°';
      return;
    }
    el.innerText = `${Math.round(heading)}°`;
    if (window.nomadBubbles.compass.active !== false) {
      window.applyBubbleConfigUI('compass');
    }
  };

  window.renderAltitudeBubble = function(altMeters) {
    const el = document.getElementById('altitude-bubble-value');
    if (!el) return;
    const meters = (typeof altMeters === 'number') ? altMeters : window.rawAltitudeMeters;
    if (meters === null || isNaN(meters)) {
      el.innerText = '--';
      return;
    }
    const feet = Math.round(meters * 3.28084);
    el.innerText = feet.toLocaleString();
  };

  window.renderTemperatureBubble = function() {
    const el = document.getElementById('temp-bubble-value');
    if (!el) return;
    if (window.rawTempF === null || isNaN(window.rawTempF)) {
      el.innerText = '--°';
      return;
    }
    if (window.isFahrenheit) {
      el.innerText = `${Math.round(window.rawTempF)}°`;
    } else {
      const tempC = (window.rawTempF - 32) * (5 / 9);
      el.innerText = `${Math.round(tempC)}°`;
    }
  };

  window.renderAtmoBubble = function() {
    const b = window.nomadBubbles.atmo;
    const humRow = document.getElementById('atmo-row-humidity');
    const uvRow = document.getElementById('atmo-row-uv');
    const pressRow = document.getElementById('atmo-row-pressure');
    const humVal = document.getElementById('atmo-val-humidity');
    const uvVal = document.getElementById('atmo-val-uv');
    const pressVal = document.getElementById('atmo-val-pressure');

    if (humRow) humRow.style.display = (b.showHumidity !== false) ? 'flex' : 'none';
    if (uvRow) uvRow.style.display = (b.showUv !== false) ? 'flex' : 'none';
    if (pressRow) pressRow.style.display = (b.showPressure !== false) ? 'flex' : 'none';

    if (humVal) {
      humVal.innerText = (typeof window.rawHumidityPercent === 'number') ? `${Math.round(window.rawHumidityPercent)}%` : '--%';
    }
    if (uvVal) {
      if (typeof window.rawUvIndex === 'number') {
        const formattedUv = (window.rawUvIndex % 1 === 0) ? window.rawUvIndex.toFixed(0) : window.rawUvIndex.toFixed(1);
        uvVal.innerText = `UV ${formattedUv}`;
      } else {
        uvVal.innerText = 'UV --';
      }
    }
    if (pressVal) {
      if (window.rawPressureHpa === null || isNaN(window.rawPressureHpa)) {
        pressVal.innerText = '--';
      } else {
        const unit = window.customPressureUnit ? window.customPressureUnit : (window.isFahrenheit ? 'in' : 'hPa');
        if (unit === 'in') {
          const inHg = (window.rawPressureHpa * 0.02953).toFixed(2);
          pressVal.innerText = `${inHg}in`;
        } else {
          pressVal.innerText = `${Math.round(window.rawPressureHpa)}hPa`;
        }
      }
    }
  };

  window.renderCoordsBubble = function(lat, lon) {
    const latEl = document.getElementById('coords-lat');
    const lonEl = document.getElementById('coords-lon');
    if (!latEl || !lonEl) return;

    if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) {
      latEl.innerText = '--.---° N';
      lonEl.innerText = '--.---° W';
      return;
    }

    const latAbs = Math.abs(lat).toFixed(3);
    const latDir = lat >= 0 ? 'N' : 'S';
    latEl.innerText = `${latAbs}° ${latDir}`;

    const lonAbs = Math.abs(lon).toFixed(3);
    const lonDir = lon >= 0 ? 'E' : 'W';
    lonEl.innerText = `${lonAbs}° ${lonDir}`;
  };

})();
