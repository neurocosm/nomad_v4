/**
 * NOMAD V4 HYPERSPACE - Vehicle & Safe Zone Module
 * /js/vehicle-safezone.js
 *
 * Responsibilities:
 * - Vehicle marker rendering (Cruise Chevron & F-117 Stealth / Arcade Galaga Fighter)
 * - 3D Perspective Drive & Camera Tilt handling (3D Take-Off 58° pitch vs Top-Down)
 * - Vehicle Safe Zone protective boundary calculation for kinetic bubbles
 * - Perspective toggling & dynamic fighter button state
 */

(function() {
  'use strict';

  window.NomadState = window.NomadState || {};

  // Default vehicle & camera states
  window.isGalagaMode = window.isGalagaMode || false;
  window.cameraPerspectiveMode = window.cameraPerspectiveMode || 'perspective';

  /**
   * Renders the Galaga Fighter SVG based on light or dark theme
   */
  window.renderGalagaFighterSVG = function() {
    const vehicleSvg = document.getElementById('vehicle-overlay-svg');
    if (!vehicleSvg || !window.isGalagaMode) return;
    const isLight = document.getElementById('map-card')?.classList.contains('theme-light-active') || (window.currentThemeIndex === 1);

    vehicleSvg.setAttribute('viewBox', '0 0 32 32');
    vehicleSvg.removeAttribute('fill');
    vehicleSvg.removeAttribute('stroke');

    if (isLight) {
      // F-117 Stealth Fighter aesthetic for Light GPS Mode (Matte charcoal, obsidian canopy, crimson/slate accents)
      vehicleSvg.style.filter = 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.65))';
      vehicleSvg.innerHTML = `
        <!-- Main Stealth Fuselage (F-117 Matte Jet Black / Charcoal) -->
        <polygon points="16,1 19,10 19,26 13,26 13,10" fill="#1e242f" stroke="#0a0d14" stroke-width="0.9"/>
        <!-- Stealth Nose Radome (Crimson Stealth Radar) -->
        <polygon points="16,1 18,8 14,8" fill="#d90429"/>
        <!-- Left Wing & Chined Leading Edge (Tactical Dark Slate) -->
        <polygon points="13,10 13,25 2,26 6,17" fill="#2d3748" stroke="#111827" stroke-width="0.7"/>
        <!-- Left Wing Leading Tip (Infrared Dark Red) -->
        <polygon points="2,26 6,17 2,15" fill="#9b111e"/>
        <!-- Right Wing & Chined Leading Edge (Tactical Dark Slate) -->
        <polygon points="19,10 19,25 30,26 26,17" fill="#2d3748" stroke="#111827" stroke-width="0.7"/>
        <!-- Right Wing Leading Tip (Infrared Dark Red) -->
        <polygon points="30,26 26,17 30,15" fill="#9b111e"/>
        <!-- Afterburner / Low-RCS Exhaust Plume (Amber Afterburner) -->
        <rect x="14" y="26" width="4" height="4" fill="#ff9100" stroke="#b45309" stroke-width="0.5"/>
      `;
    } else {
      // Authentic Neon Arcade Galaga Fighter for Dark GPS Mode
      vehicleSvg.style.filter = 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.65))';
      vehicleSvg.innerHTML = `
        <polygon points="16,1 19,10 19,26 13,26 13,10" fill="#ffffff" stroke="#000000" stroke-width="0.8"/>
        <polygon points="16,1 18,8 14,8" fill="#ff0044"/>
        <polygon points="13,10 13,25 2,26 6,17" fill="#00d4ff"/>
        <polygon points="2,26 6,17 2,15" fill="#ff0044"/>
        <polygon points="19,10 19,25 30,26 26,17" fill="#00d4ff"/>
        <polygon points="30,26 26,17 30,15" fill="#ff0044"/>
        <rect x="14" y="26" width="4" height="4" fill="#ffcc00"/>
      `;
    }
  };

  /**
   * Renders standard Cruise Chevron marker SVG
   */
  window.renderCruiseChevronSVG = function() {
    const vehicleSvg = document.getElementById('vehicle-overlay-svg');
    if (!vehicleSvg) return;
    vehicleSvg.setAttribute('viewBox', '0 0 24 24');
    vehicleSvg.setAttribute('fill', '#007aff');
    vehicleSvg.setAttribute('stroke', '#ffffff');
    vehicleSvg.setAttribute('stroke-width', '2');
    vehicleSvg.setAttribute('stroke-linecap', 'round');
    vehicleSvg.setAttribute('stroke-linejoin', 'round');
    vehicleSvg.style.filter = 'drop-shadow(0px 2px 5px rgba(0,0,0,0.6))';
    vehicleSvg.innerHTML = `<polygon points="12 2 19 21 12 17 5 21 12 2"/>`;
  };

  /**
   * Updates top-right button icon to show the alternate vehicle mode
   */
  window.updateFighterButtonUI = function() {
    const btn = document.getElementById('fighter-toggle-btn');
    if (!btn) return;
    const icon = btn.querySelector('svg');

    if (window.isGalagaMode) {
      // Vehicle is Galaga Fighter -> Button displays Cruise Chevron (the alternate option)
      btn.classList.add('active-fighter');
      btn.setAttribute('title', 'Switch to Cruise Chevron');
      btn.setAttribute('aria-label', 'Switch to Cruise Chevron');
      if (icon) {
        icon.setAttribute('viewBox', '0 0 24 24');
        icon.setAttribute('fill', 'none');
        icon.innerHTML = `<polygon points="12 3 20 20 12 16 4 20 12 3" fill="currentColor" stroke="#ffffff" stroke-width="1.6" stroke-linejoin="round"/>`;
      }
    } else {
      // Vehicle is Cruise Chevron -> Button displays Galaga Fighter (the alternate option)
      btn.classList.remove('active-fighter');
      btn.setAttribute('title', 'Switch to Galaga Fighter');
      btn.setAttribute('aria-label', 'Switch to Galaga Fighter');
      if (icon) {
        icon.setAttribute('viewBox', '0 0 24 24');
        icon.setAttribute('fill', 'none');
        icon.innerHTML = `
          <polygon points="12,2 14,8 14,19 10,19 10,8" fill="#ffffff"/>
          <polygon points="12,2 13.5,6.5 10.5,6.5" fill="#ff0044"/>
          <polygon points="10,8 10,18 2,19 5,13" fill="#00d4ff"/>
          <polygon points="2,19 5,13 2,11.5" fill="#ff0044"/>
          <polygon points="14,8 14,18 22,19 19,13" fill="#00d4ff"/>
          <polygon points="22,19 19,13 22,11.5" fill="#ff0044"/>
          <rect x="11" y="19" width="2" height="3" fill="#ffcc00"/>
        `;
      }
    }
  };

  /**
   * Toggles between Cruise Chevron and Galaga Fighter
   */
  window.toggleGalagaMode = function() {
    window.isGalagaMode = !window.isGalagaMode;
    window.NomadState.isGalagaMode = window.isGalagaMode;
    const dashboard = document.getElementById('main-dashboard');
    const badgeEl = document.getElementById('heading-text');

    if (typeof window.playArcadeSound === 'function') {
      window.playArcadeSound(window.isGalagaMode);
    }

    if (window.isGalagaMode) {
      if (dashboard) dashboard.classList.add('galaga-theme');
      window.renderGalagaFighterSVG();
      if (typeof window.showMapThemeToast === 'function') {
        window.showMapThemeToast({ name: 'Galaga Fighter Active', type: 'fighter' });
      }
      if (badgeEl) {
        if (window.hudBannerTimeout) clearTimeout(window.hudBannerTimeout);
        badgeEl.innerHTML = `<div class="telemetry-circle-val" style="color:#00d4ff; font-size:1.1em; font-weight:700;">FIGHTER</div>`;
        if (typeof window.renderTelemetryBadge === 'function') {
          window.hudBannerTimeout = setTimeout(window.renderTelemetryBadge, 1500);
        }
      }
    } else {
      if (dashboard) dashboard.classList.remove('galaga-theme');
      window.renderCruiseChevronSVG();
      if (typeof window.showMapThemeToast === 'function') {
        window.showMapThemeToast({ name: 'Cruise Chevron Active', type: 'cruise' });
      }
      if (badgeEl) {
        if (window.hudBannerTimeout) clearTimeout(window.hudBannerTimeout);
        badgeEl.innerHTML = `<div class="telemetry-circle-val" style="color:#007aff; font-size:1.1em; font-weight:700;">CRUISE</div>`;
        if (typeof window.renderTelemetryBadge === 'function') {
          window.hudBannerTimeout = setTimeout(window.renderTelemetryBadge, 1300);
        }
      }
    }
    window.updateFighterButtonUI();
    window.updateCompassAndVehicleOrientation(window.currentHeading || 0);
  };

  /**
   * Cycles camera perspective between:
   * 1. 3D Take-Off Drive (58° pitch, track-up)
   * 2. Top-Down Centered (0° pitch, north-up)
   * 3. Top-Down Track-Up (0° pitch, track-up)
   */
  window.cyclePerspectiveMode = function(event) {
    if (event) {
      event.stopPropagation();
      if (event.cancelable) event.preventDefault();
    }
    
    if (window.cameraPerspectiveMode === 'perspective') {
      window.cameraPerspectiveMode = 'north-up';
      window.currentPitch = 0;
      window.isHeadingUp = false;
      if (typeof window.showMapThemeToast === 'function') {
        window.showMapThemeToast({ name: 'Top-Down Centered (North-Up)', type: 'perspective' });
      }
    } else if (window.cameraPerspectiveMode === 'north-up') {
      window.cameraPerspectiveMode = 'overview';
      window.currentPitch = 0;
      window.isHeadingUp = true;
      if (typeof window.showMapThemeToast === 'function') {
        window.showMapThemeToast({ name: 'Top-Down Track-Up (Centered)', type: 'perspective' });
      }
    } else {
      window.cameraPerspectiveMode = 'perspective';
      window.currentPitch = 58;
      window.isHeadingUp = true;
      if (typeof window.showMapThemeToast === 'function') {
        window.showMapThemeToast({ name: '3D Take-Off Drive (58° Pitch)', type: 'perspective' });
      }
    }
    window.NomadState.cameraPerspectiveMode = window.cameraPerspectiveMode;

    const compassBtn = document.getElementById('compass-btn');
    const vehicleOverlay = document.getElementById('vehicle-overlay');

    if (compassBtn) {
      compassBtn.classList.remove('perspective-3d', 'perspective-overview', 'perspective-north-up');
      compassBtn.classList.add(`perspective-${window.cameraPerspectiveMode}`);
      if (window.cameraPerspectiveMode === 'north-up') {
        compassBtn.classList.remove('active-heading-up');
      } else {
        compassBtn.classList.add('active-heading-up');
      }
    }

    if (vehicleOverlay) {
      vehicleOverlay.classList.remove('mode-heading-up', 'mode-north-up', 'mode-overview', 'mode-perspective');
      if (window.cameraPerspectiveMode === 'north-up') {
        vehicleOverlay.classList.add('mode-north-up');
      } else if (window.cameraPerspectiveMode === 'overview') {
        vehicleOverlay.classList.add('mode-overview');
      } else {
        vehicleOverlay.classList.add('mode-heading-up');
      }
    }

    const safeZone = document.getElementById('vehicle-safe-zone');
    if (safeZone) {
      safeZone.classList.remove('mode-heading-up', 'mode-north-up', 'mode-overview', 'mode-perspective');
      if (window.cameraPerspectiveMode === 'north-up') {
        safeZone.classList.add('mode-north-up');
      } else if (window.cameraPerspectiveMode === 'overview') {
        safeZone.classList.add('mode-overview');
      } else {
        safeZone.classList.add('mode-heading-up');
      }
    }

    if (typeof window.syncMapPadding === 'function') window.syncMapPadding();
    window.updateCompassAndVehicleOrientation(window.currentHeading || 0);
    if (window.lastLat !== null && window.lastLon !== null && typeof window.updateMapCamera === 'function') {
      window.updateMapCamera([window.lastLon, window.lastLat], true);
    }
  };

  window.togglePitchMode = function() {
    window.cyclePerspectiveMode();
  };

  /**
   * Aligns vehicle marker, needle, and safe zone transforms with current heading & camera mode
   */
  window.updateCompassAndVehicleOrientation = function(heading) {
    const needleEl = document.getElementById('needle-svg');
    const vehicleSvg = document.getElementById('vehicle-overlay-svg');
    const safeZone = document.getElementById('vehicle-safe-zone');
    const h = (heading !== null && !isNaN(heading)) ? heading : 0;
    
    if (window.cameraPerspectiveMode === 'north-up') {
      if (needleEl) needleEl.style.transform = 'rotate(0deg)';
      if (vehicleSvg) vehicleSvg.style.transform = `perspective(600px) rotateX(0deg) rotate(${h}deg)`;
      if (safeZone) safeZone.style.transform = 'perspective(600px) rotateX(0deg)';
    } else if (window.cameraPerspectiveMode === 'overview') {
      if (needleEl) needleEl.style.transform = `rotate(${-h}deg)`;
      if (vehicleSvg) vehicleSvg.style.transform = 'perspective(600px) rotateX(0deg) rotate(0deg)';
      if (safeZone) safeZone.style.transform = 'perspective(600px) rotateX(0deg)';
    } else {
      // 'perspective' (3D Perspective Drive with 58° pitch)
      if (needleEl) needleEl.style.transform = `rotate(${-h}deg)`;
      if (vehicleSvg) vehicleSvg.style.transform = 'perspective(600px) rotateX(42deg) rotate(0deg)';
      if (safeZone) safeZone.style.transform = 'perspective(600px) rotateX(42deg)';
    }
  };

  /**
   * =========================================================================
   * VEHICLE & SAFE-ZONE SATELLITE MOON CONFIGURATION (NOMAD V4 HYPERSPACE)
   * =========================================================================
   */
  const DEFAULT_VEHICLE_CONFIG = {
    safeZoneRadius: 68,        // 68px radius (136px diameter)
    satelliteActive: true,     // Orbiting Satellite Active
    satelliteMode: 'compass',  // 'compass' (points North around safe-zone circle) or 'orbit' (continuous kinetic orbit)
    satelliteShape: 'point',   // 'point' (tapered needle / diamond rosette pointer), 'orb' (classic circle), or 'rosette' (4-point star)
    satelliteColor: '#ff2a2a', // Default Ruby Red for North Pointer, or user swatch
    satelliteColorShiftOnHit: true, // Color of deflecting data bubble transfers to moon in orbit mode
    satelliteSize: 20,         // Standard dimension in px: Compact (14), Standard (20), Hero (28)
    satelliteSpeedLevel: 2,    // 1: Gentle, 2: Cruising, 3: Rapid, 4: Warp
    orbitAngle: 0,
    orbitDirection: 1,         // 1 (CW) or -1 (CCW)
    lastDeflectionTime: 0
  };

  function loadVehicleConfig() {
    try {
      const saved = localStorage.getItem('nomad_vehicle_safezone_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged = Object.assign({}, DEFAULT_VEHICLE_CONFIG, parsed);
        // Upgrade legacy tiny sizes (< 14px) to crisp standard 20px
        if (typeof merged.satelliteSize === 'number' && merged.satelliteSize < 14) {
          merged.satelliteSize = 20;
        }
        return merged;
      }
    } catch (e) {
      console.warn('Failed to load vehicle config from localStorage', e);
    }
    return Object.assign({}, DEFAULT_VEHICLE_CONFIG);
  }

  window.nomadVehicleConfig = loadVehicleConfig();

  window.saveVehicleConfig = function() {
    try {
      localStorage.setItem('nomad_vehicle_safezone_config', JSON.stringify({
        safeZoneRadius: window.nomadVehicleConfig.safeZoneRadius,
        satelliteActive: window.nomadVehicleConfig.satelliteActive,
        satelliteMode: window.nomadVehicleConfig.satelliteMode,
        satelliteShape: window.nomadVehicleConfig.satelliteShape,
        satelliteColor: window.nomadVehicleConfig.satelliteColor,
        satelliteSize: window.nomadVehicleConfig.satelliteSize,
        satelliteSpeedLevel: window.nomadVehicleConfig.satelliteSpeedLevel
      }));
    } catch (e) {
      console.warn('Failed to save vehicle config', e);
    }
  };

  /**
   * Helper to generate crisp, high-visibility SVG markup for satellite indicators
   */
  window.renderSatelliteShapeSVG = function(shape, size, col) {
    col = col || '#ff2a2a';
    if (shape === 'point') {
      // Bold Faceted Needle / Diamond Rosette Pointer (Points directly outwards/North)
      return `
        <svg viewBox="0 0 24 44" width="100%" height="100%" style="overflow:visible; display:block; filter: drop-shadow(0 0 7px ${col}) drop-shadow(0 2px 4px rgba(0,0,0,0.88));">
          <!-- North Pointer Facets -->
          <polygon points="12,0 3,22 12,24" fill="#ffffff" opacity="0.95" />
          <polygon points="12,0 21,22 12,24" fill="${col}" opacity="0.95" />
          <!-- South Tail Facets -->
          <polygon points="12,44 3,22 12,24" fill="#94a3b8" opacity="0.85" />
          <polygon points="12,44 21,22 12,24" fill="#334155" opacity="0.95" />
          <!-- Needle Outline -->
          <polygon points="12,0 21,22 12,44 3,22" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-linejoin="round" />
          <!-- Center Compass Jewel / Pivot Ring aligned with safe circle perimeter -->
          <circle cx="12" cy="22" r="3.6" fill="#ffffff" stroke="#040914" stroke-width="1.2" />
          <circle cx="12" cy="22" r="1.7" fill="${col}" />
        </svg>
      `;
    } else if (shape === 'rosette') {
      // 4-point Nautical Compass Star Rosette with elongated North needle
      return `
        <svg viewBox="0 0 34 46" width="100%" height="100%" style="overflow:visible; display:block; filter: drop-shadow(0 0 7px ${col}) drop-shadow(0 2px 4px rgba(0,0,0,0.88));">
          <!-- North Point (Elongated Hero Pointer) -->
          <polygon points="17,0 21,23 17,18" fill="${col}" />
          <polygon points="17,0 13,23 17,18" fill="#ffffff" opacity="0.95" />
          <!-- South Point -->
          <polygon points="17,46 21,23 17,28" fill="#475569" opacity="0.9" />
          <polygon points="17,46 13,23 17,28" fill="#94a3b8" opacity="0.85" />
          <!-- East Point -->
          <polygon points="34,23 17,28 17,18" fill="${col}" opacity="0.85" />
          <polygon points="34,23 17,23 17,18" fill="#ffffff" opacity="0.5" />
          <!-- West Point -->
          <polygon points="0,23 17,28 17,18" fill="#94a3b8" opacity="0.85" />
          <polygon points="0,23 17,23 17,18" fill="#ffffff" opacity="0.9" />
          <!-- Center Jewel -->
          <circle cx="17" cy="23" r="3.6" fill="#ffffff" stroke="#040914" stroke-width="1.2" />
          <circle cx="17" cy="23" r="1.7" fill="${col}" />
        </svg>
      `;
    } else {
      // Classic Glowing Orb / Spherical Satellite
      return `
        <svg viewBox="0 0 24 24" width="100%" height="100%" style="overflow:visible; display:block; filter: drop-shadow(0 0 8px ${col}) drop-shadow(0 0 3px #ffffff);">
          <circle cx="12" cy="12" r="9.5" fill="${col}" />
          <circle cx="9" cy="9" r="4.5" fill="#ffffff" opacity="0.7" />
          <circle cx="8" cy="8" r="2" fill="#ffffff" opacity="0.95" />
          <circle cx="12" cy="12" r="9.5" fill="none" stroke="#ffffff" stroke-width="1.2" />
        </svg>
      `;
    }
  };

  /**
   * Applies vehicle safe zone and satellite moon properties directly to DOM
   */
  window.applyVehicleSafeZoneConfig = function() {
    const cfg = window.nomadVehicleConfig;
    if (!cfg) return;

    const safeZone = document.getElementById('vehicle-safe-zone');
    if (safeZone) {
      const r = cfg.safeZoneRadius || 68;
      safeZone.style.width = (r * 2) + 'px';
      safeZone.style.height = (r * 2) + 'px';
      safeZone.style.marginLeft = (-r) + 'px';
      safeZone.style.marginTop = (-r) + 'px';
    }

    const arm = document.getElementById('safe-zone-satellite-arm');
    if (arm) {
      arm.style.display = cfg.satelliteActive ? 'block' : 'none';
    }

    const moon = document.getElementById('safe-zone-satellite-moon');
    if (moon) {
      const size = cfg.satelliteSize || 20;
      const col = cfg.satelliteColor || '#ff2a2a';
      const shape = cfg.satelliteShape || 'point';

      moon.style.pointerEvents = 'auto';
      moon.style.cursor = 'pointer';
      moon.style.touchAction = 'manipulation';
      moon.title = (cfg.satelliteMode === 'compass')
        ? '🧭 Satellite: Orbital Compass (Points North) - Tap to toggle Kinetic Orbit'
        : '🌀 Satellite: Continuous Kinetic Orbit - Tap to toggle Compass Mode';

      moon.onclick = function(e) {
        e.stopPropagation();
        window.toggleVehicleSatelliteMode();
      };

      if (shape === 'point') {
        // Pointy Diamond / Needle Rosette Pointer
        let w = 24;
        let h = 42;
        if (size >= 26) {
          w = 30;
          h = 54;
        } else if (size <= 15) {
          w = 18;
          h = 32;
        }
        const halfW = w / 2;
        const halfH = h / 2;
        moon.style.width = w + 'px';
        moon.style.height = h + 'px';
        moon.style.top = '-' + halfH + 'px';
        moon.style.left = 'calc(50% - ' + halfW + 'px)';
        moon.style.borderRadius = '0';
        moon.style.background = 'transparent';
        moon.style.boxShadow = 'none';
        moon.innerHTML = window.renderSatelliteShapeSVG('point', size, col);
      } else if (shape === 'rosette') {
        // 4-point Nautical Compass Star Rosette
        let w = 34;
        let h = 46;
        if (size >= 26) {
          w = 42;
          h = 56;
        } else if (size <= 15) {
          w = 26;
          h = 36;
        }
        const halfW = w / 2;
        const halfH = h / 2;
        moon.style.width = w + 'px';
        moon.style.height = h + 'px';
        moon.style.top = '-' + halfH + 'px';
        moon.style.left = 'calc(50% - ' + halfW + 'px)';
        moon.style.borderRadius = '0';
        moon.style.background = 'transparent';
        moon.style.boxShadow = 'none';
        moon.innerHTML = window.renderSatelliteShapeSVG('rosette', size, col);
      } else {
        // Classic Glowing Orb
        const s = Math.max(14, size);
        const half = s / 2;
        moon.style.width = s + 'px';
        moon.style.height = s + 'px';
        moon.style.top = '-' + half + 'px';
        moon.style.left = 'calc(50% - ' + half + 'px)';
        moon.style.borderRadius = '50%';
        moon.style.background = 'transparent';
        moon.style.boxShadow = 'none';
        moon.innerHTML = window.renderSatelliteShapeSVG('orb', s, col);
      }
    }

    if (typeof window.updateVehicleSatelliteModalPreview === 'function') {
      window.updateVehicleSatelliteModalPreview();
    }
  };

  /**
   * Toggles satellite mode between 'compass' and 'orbit' with haptic feedback & toast
   */
  window.toggleVehicleSatelliteMode = function() {
    const cfg = window.nomadVehicleConfig;
    if (!cfg) return;
    cfg.satelliteMode = (cfg.satelliteMode === 'compass') ? 'orbit' : 'compass';
    window.applyVehicleSafeZoneConfig();
    window.saveVehicleConfig();
    window.syncVehicleModalUI();

    if (navigator.vibrate) navigator.vibrate(40);

    const isCompass = (cfg.satelliteMode === 'compass');
    const toastName = isCompass ? '🧭 Satellite: Orbital Compass (Points North)' : '🌀 Satellite: Continuous Kinetic Orbit';
    if (typeof window.showMapThemeToast === 'function') {
      window.showMapThemeToast({ name: toastName, type: 'satellite' });
    }
  };

  /**
   * Continuous orbital update for satellite moon / compass indicator
   * In 'compass' mode: smoothly tracks True North relative to vehicle track around the safe circle
   * In 'orbit' mode: circles continuously and accelerates with GPS vehicle speed
   */
  window.updateSatelliteMoonOrbit = function() {
    const cfg = window.nomadVehicleConfig;
    if (!cfg || !cfg.satelliteActive) return;

    const arm = document.getElementById('safe-zone-satellite-arm');
    if (!arm) return;

    if (cfg.satelliteMode === 'compass') {
      // COMPASS MODE: Satellite points to Magnetic/True North around the safe-circle perimeter!
      // In heading-up/perspective mode, vehicle faces 0° (top/12 o'clock).
      // North is positioned at -heading (e.g. driving East at 90° means North is to the left at 270° / -90°).
      let effectiveHeading = 0;
      if (typeof window.currentHeading === 'number' && !isNaN(window.currentHeading) && window.currentHeading !== 0) {
        effectiveHeading = window.currentHeading;
      } else if (window.map && typeof window.map.getBearing === 'function') {
        effectiveHeading = (window.map.getBearing() % 360 + 360) % 360;
      }

      const camMode = window.cameraPerspectiveMode || 'perspective';
      let targetAngle = 0;
      if (camMode === 'north-up') {
        // In north-up mode, the map is already oriented North-up, so North on the safe-circle is top (0°)
        targetAngle = 0;
      } else {
        // In driving perspective or overview track-up, North rotates relative to vehicle heading/bearing
        targetAngle = (360 - (effectiveHeading % 360)) % 360;
      }

      // Smooth damped angular interpolation (shortest arc around 360)
      let current = cfg.orbitAngle || 0;
      let diff = (targetAngle - current) % 360;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;

      // Smooth responsive tracking factor (0.22 spring damping)
      cfg.orbitAngle = (current + diff * 0.22 + 360) % 360;
      arm.style.transform = `rotate(${cfg.orbitAngle.toFixed(2)}deg)`;
    } else {
      // CONTINUOUS KINETIC ORBIT MODE
      const currentMph = (typeof window.currentSpeedMph === 'number' && !isNaN(window.currentSpeedMph))
        ? Math.max(0, window.currentSpeedMph)
        : 0;

      const baseRates = [0, 0.8, 1.6, 2.8, 4.2];
      const baseRate = baseRates[cfg.satelliteSpeedLevel || 2] || 1.6;
      const speedBonus = (currentMph / 30) * (cfg.satelliteSpeedLevel || 2) * 0.5;
      const step = baseRate + speedBonus;

      cfg.orbitAngle = ((cfg.orbitAngle || 0) + (cfg.orbitDirection || 1) * step + 360) % 360;
      arm.style.transform = `rotate(${cfg.orbitAngle.toFixed(2)}deg)`;
    }

    if (typeof window.updateVehicleSatelliteModalPreview === 'function') {
      window.updateVehicleSatelliteModalPreview();
    }
  };

  /**
   * Reverses orbit direction and optionally shifts moon color when a kinetic bubble deflects off the safe-zone forcefield.
   * NOTE: When used as an Orbital Compass, ALL secondary burst, pop pulse, and color morph effects are suppressed
   * so the compass remains clean, steady, and distraction-free.
   */
  window.triggerSafeZoneDeflectionFlip = function(bubbleKey, bubbleColor) {
    const cfg = window.nomadVehicleConfig;
    if (!cfg || !cfg.satelliteActive) return;

    // When used as a compass, do not trigger burst pop, color morph, or orbit flip on bubble deflection
    if (cfg.satelliteMode === 'compass') {
      return;
    }

    const now = Date.now();
    if (now - (cfg.lastDeflectionTime || 0) < 320) return;
    cfg.lastDeflectionTime = now;

    // Reverse orbital direction (in kinetic orbit mode)
    cfg.orbitDirection = (cfg.orbitDirection || 1) * -1;

    // If dynamic collision color shift is enabled, morph moon color to match deflecting bubble (in kinetic orbit mode)
    if (cfg.satelliteColorShiftOnHit !== false && bubbleColor) {
      cfg.satelliteColor = bubbleColor;
      window.applyVehicleSafeZoneConfig();
      // Sync swatches in modal UI if open
      const swatches = document.querySelectorAll('#vehicle-satellite-swatches .bubble-color-swatch');
      swatches.forEach(s => {
        const col = s.getAttribute('data-color');
        s.classList.toggle('is-selected', col && col.toLowerCase() === bubbleColor.toLowerCase());
      });
    }

    // Momentary kinetic pop pulse on the satellite moon (kinetic orbit mode only)
    const moon = document.getElementById('safe-zone-satellite-moon');
    if (moon) {
      moon.style.transform = 'scale(2.2)';
      moon.style.filter = 'brightness(1.8)';
      setTimeout(() => {
        if (moon) {
          moon.style.transform = 'scale(1)';
          moon.style.filter = 'none';
        }
      }, 180);
    }
  };

  /**
   * Sets whether the moon adopts the color of whatever data bubble hits it
   */
  window.setVehicleSatelliteColorShiftOnHit = function(enabled) {
    window.nomadVehicleConfig.satelliteColorShiftOnHit = !!enabled;
    window.saveVehicleConfig();
    window.syncVehicleModalUI();
  };

  /**
   * Switches active vehicle marker (Cruise Chevron vs Galaga Fighter)
   */
  window.setVehicleMarkerMode = function(mode) {
    if (mode === 'galaga' && !window.isGalagaMode) {
      window.toggleGalagaMode();
    } else if (mode === 'cruise' && window.isGalagaMode) {
      window.toggleGalagaMode();
    }
    window.syncVehicleModalUI();
  };

  /**
   * Sets Safe-Zone protective boundary radius (in px)
   */
  window.setVehicleSafeZoneRadius = function(radius) {
    radius = Math.max(45, Math.min(120, parseInt(radius, 10) || 68));
    window.nomadVehicleConfig.safeZoneRadius = radius;
    window.applyVehicleSafeZoneConfig();
    window.saveVehicleConfig();
    window.syncVehicleModalUI();
  };

  window.onVehicleSafeZoneSliderChange = function(val) {
    window.setVehicleSafeZoneRadius(val);
  };

  /**
   * Sets Satellite Moon Active / Inactive
   */
  window.setVehicleSatelliteActive = function(active) {
    window.nomadVehicleConfig.satelliteActive = !!active;
    window.applyVehicleSafeZoneConfig();
    window.saveVehicleConfig();
    window.syncVehicleModalUI();
  };

  /**
   * Sets Satellite Operating Mode ('compass' vs 'orbit')
   */
  window.setVehicleSatelliteMode = function(mode) {
    window.nomadVehicleConfig.satelliteMode = (mode === 'orbit') ? 'orbit' : 'compass';
    window.applyVehicleSafeZoneConfig();
    window.saveVehicleConfig();
    window.syncVehicleModalUI();
  };

  /**
   * Sets Satellite Indicator Geometry / Shape ('point' vs 'orb' vs 'rosette')
   */
  window.setVehicleSatelliteShape = function(shape) {
    if (!['point', 'orb', 'rosette'].includes(shape)) shape = 'point';
    window.nomadVehicleConfig.satelliteShape = shape;
    window.applyVehicleSafeZoneConfig();
    window.saveVehicleConfig();
    window.syncVehicleModalUI();
  };

  /**
   * Sets Satellite Moon Color
   */
  window.setVehicleSatelliteColor = function(hex) {
    window.nomadVehicleConfig.satelliteColor = hex;
    window.applyVehicleSafeZoneConfig();
    window.saveVehicleConfig();
    window.syncVehicleModalUI();
  };

  /**
   * Sets Satellite Moon Size (in px)
   */
  window.setVehicleSatelliteSize = function(size) {
    size = parseInt(size, 10) || 20;
    // Normalize to one of the 3 polished presets: Compact (14px), Standard (20px), Hero (28px)
    if (size <= 10) size = 14;
    else if (size <= 16 && size > 10) size = (size === 16 ? 28 : 20);
    else if (size < 18) size = 14;
    else if (size > 24) size = 28;
    else size = 20;

    window.nomadVehicleConfig.satelliteSize = size;
    window.applyVehicleSafeZoneConfig();
    window.saveVehicleConfig();
    window.syncVehicleModalUI();
  };

  /**
   * Test nudges or spins the satellite preview angle
   */
  window.testRotateSatellitePreview = function() {
    const cfg = window.nomadVehicleConfig;
    if (!cfg) return;
    cfg.orbitAngle = ((cfg.orbitAngle || 0) + 45) % 360;
    const arm = document.getElementById('safe-zone-satellite-arm');
    if (arm) arm.style.transform = `rotate(${cfg.orbitAngle.toFixed(2)}deg)`;
    window.updateVehicleSatelliteModalPreview();
    if (navigator.vibrate) navigator.vibrate(25);
  };

  /**
   * Live preview synchronizer for the satellite card inside the Hyperspace configuration modal
   */
  window.updateVehicleSatelliteModalPreview = function() {
    const cfg = window.nomadVehicleConfig;
    if (!cfg) return;

    const armPreview = document.getElementById('satellite-preview-arm');
    const moonPreview = document.getElementById('satellite-preview-moon');
    const modeBadge = document.getElementById('satellite-preview-mode-badge');

    if (modeBadge) {
      if (cfg.satelliteMode === 'compass') {
        modeBadge.textContent = '🧭 Compass (Points North)';
        modeBadge.style.color = '#00d4ff';
        modeBadge.style.borderColor = 'rgba(0, 212, 255, 0.35)';
        modeBadge.style.background = 'rgba(0, 212, 255, 0.12)';
      } else {
        modeBadge.textContent = '🌀 Kinetic Orbit (Spinning)';
        modeBadge.style.color = '#ffb703';
        modeBadge.style.borderColor = 'rgba(255, 183, 3, 0.35)';
        modeBadge.style.background = 'rgba(255, 183, 3, 0.12)';
      }
    }

    if (armPreview) {
      const angle = cfg.orbitAngle || 0;
      armPreview.style.transform = `rotate(${angle.toFixed(2)}deg)`;
    }

    if (moonPreview) {
      const size = cfg.satelliteSize || 20;
      const col = cfg.satelliteColor || '#ff2a2a';
      const shape = cfg.satelliteShape || 'point';

      if (shape === 'point') {
        moonPreview.style.width = '20px';
        moonPreview.style.height = '36px';
        moonPreview.style.top = '-18px';
        moonPreview.style.left = 'calc(50% - 10px)';
        moonPreview.style.borderRadius = '0';
        moonPreview.style.background = 'transparent';
        moonPreview.style.boxShadow = 'none';
        moonPreview.innerHTML = window.renderSatelliteShapeSVG('point', size, col);
      } else if (shape === 'rosette') {
        moonPreview.style.width = '28px';
        moonPreview.style.height = '38px';
        moonPreview.style.top = '-19px';
        moonPreview.style.left = 'calc(50% - 14px)';
        moonPreview.style.borderRadius = '0';
        moonPreview.style.background = 'transparent';
        moonPreview.style.boxShadow = 'none';
        moonPreview.innerHTML = window.renderSatelliteShapeSVG('rosette', size, col);
      } else {
        moonPreview.style.width = '18px';
        moonPreview.style.height = '18px';
        moonPreview.style.top = '-9px';
        moonPreview.style.left = 'calc(50% - 9px)';
        moonPreview.style.borderRadius = '50%';
        moonPreview.style.background = 'transparent';
        moonPreview.style.boxShadow = 'none';
        moonPreview.innerHTML = window.renderSatelliteShapeSVG('orb', size, col);
      }
    }
  };

  /**
   * Sets Satellite Orbit Velocity Level (1-4)
   */
  window.setVehicleSatelliteSpeed = function(level) {
    level = parseInt(level, 10) || 2;
    window.nomadVehicleConfig.satelliteSpeedLevel = level;
    window.saveVehicleConfig();
    window.syncVehicleModalUI();
  };

  /**
   * Manually reverses orbit direction
   */
  window.reverseVehicleSatelliteSpin = function() {
    window.triggerSafeZoneDeflectionFlip('manual');
  };

  /**
   * Synchronizes the Vehicle & Safe-Zone section UI in the modal
   */
  window.syncVehicleModalUI = function() {
    const cfg = window.nomadVehicleConfig;
    if (!cfg) return;

    // 1. Vehicle Marker Mode buttons
    const btnChevron = document.getElementById('vehicle-btn-chevron');
    const btnGalaga = document.getElementById('vehicle-btn-galaga');
    if (btnChevron && btnGalaga) {
      btnChevron.classList.toggle('is-selected', !window.isGalagaMode);
      btnGalaga.classList.toggle('is-selected', !!window.isGalagaMode);
    }

    // 2. Safe-Zone Radius & Slider
    const r = cfg.safeZoneRadius || 68;
    const diameter = r * 2;
    const badge = document.getElementById('vehicle-safezone-val-badge');
    if (badge) {
      let desc = 'Standard';
      if (diameter <= 115) desc = 'Tight';
      else if (diameter >= 210) desc = 'Expansive';
      else if (diameter >= 170) desc = 'Wide';
      badge.innerText = `${diameter}px (${desc})`;
    }

    const slider = document.getElementById('vehicle-safezone-slider');
    if (slider) slider.value = r;

    [55, 68, 90, 110].forEach(val => {
      const presetBtn = document.getElementById(`safezone-preset-${val}`);
      if (presetBtn) {
        presetBtn.classList.toggle('is-selected', Math.abs(r - val) < 3);
      }
    });

    // 3. Satellite Active Toggle
    const btnActive = document.getElementById('satellite-status-active');
    const btnInactive = document.getElementById('satellite-status-inactive');
    if (btnActive && btnInactive) {
      btnActive.classList.toggle('is-selected', !!cfg.satelliteActive);
      btnInactive.classList.toggle('is-selected', !cfg.satelliteActive);
    }

    // 4. Satellite Operating Mode (Compass Rosette vs Kinetic Orbit)
    const btnModeCompass = document.getElementById('satellite-mode-compass');
    const btnModeOrbit = document.getElementById('satellite-mode-orbit');
    if (btnModeCompass && btnModeOrbit) {
      btnModeCompass.classList.toggle('is-selected', cfg.satelliteMode !== 'orbit');
      btnModeOrbit.classList.toggle('is-selected', cfg.satelliteMode === 'orbit');
    }

    // 5. Satellite Geometry / Shape (Pointy Needle vs Classic Orb vs Star Rosette)
    ['point', 'orb', 'rosette'].forEach(sh => {
      const btn = document.getElementById(`satellite-shape-${sh}`);
      if (btn) {
        btn.classList.toggle('is-selected', (cfg.satelliteShape || 'point') === sh);
      }
    });

    // 6. Tab status dot
    const statusDot = document.getElementById('bubble-tab-status-vehicle');
    if (statusDot) {
      statusDot.classList.toggle('is-active', !!cfg.satelliteActive);
    }

    // 7. Satellite Color Swatches (Exact same swatch style as data bubbles)
    const swatches = document.querySelectorAll('#vehicle-satellite-swatches .bubble-color-swatch');
    swatches.forEach(s => {
      const col = s.getAttribute('data-color');
      s.classList.toggle('is-selected', col && col.toLowerCase() === (cfg.satelliteColor || '').toLowerCase());
    });

    // 8. Satellite Size Buttons
    const currentSize = cfg.satelliteSize || 20;
    [14, 20, 28].forEach(sz => {
      const btn = document.getElementById(`satellite-size-${sz}`);
      if (btn) {
        btn.classList.toggle('is-selected', currentSize === sz);
      }
    });
    // Legacy button fallback
    [8, 12, 16].forEach((sz, idx) => {
      const targetMapped = [14, 20, 28][idx];
      const legacyBtn = document.getElementById(`satellite-size-${sz}`);
      if (legacyBtn) {
        legacyBtn.classList.toggle('is-selected', currentSize === targetMapped || currentSize === sz);
      }
    });

    // 9. Satellite Speed Buttons & Section Toggle (only applicable in kinetic orbit mode)
    const isOrbit = (cfg.satelliteMode === 'orbit');
    const speedSection = document.getElementById('vehicle-satellite-speed-section');
    if (speedSection) {
      speedSection.style.display = isOrbit ? 'block' : 'none';
    }
    [1, 2, 3, 4].forEach(lvl => {
      const btn = document.getElementById(`satellite-speed-${lvl}`);
      if (btn) {
        btn.classList.toggle('is-selected', (cfg.satelliteSpeedLevel || 2) === lvl);
      }
    });

    // 10. Moon Collision Color Shift Toggle & Reverse Button (only applicable in kinetic orbit mode)
    const shiftSection = document.getElementById('vehicle-satellite-shift-section');
    if (shiftSection) {
      shiftSection.style.display = isOrbit ? 'block' : 'none';
    }
    const reverseBtn = document.getElementById('vehicle-satellite-reverse-btn');
    if (reverseBtn) {
      reverseBtn.style.display = isOrbit ? 'inline-block' : 'none';
    }
    const helperText = document.getElementById('vehicle-satellite-helper-text');
    if (helperText) {
      helperText.textContent = isOrbit
        ? 'Orbits continuously around the vehicle safe zone circle with GPS speed sync.'
        : '🧭 Compass Mode: Stays locked strictly to North. Distraction-free (bursts & color morphs suppressed).';
    }
    const btnShiftOn = document.getElementById('satellite-shift-on');
    const btnShiftOff = document.getElementById('satellite-shift-off');
    if (btnShiftOn && btnShiftOff) {
      const isShift = cfg.satelliteColorShiftOnHit !== false;
      btnShiftOn.classList.toggle('is-selected', isShift);
      btnShiftOff.classList.toggle('is-selected', !isShift);
    }

    // 11. Live Satellite Preview in modal
    if (typeof window.updateVehicleSatelliteModalPreview === 'function') {
      window.updateVehicleSatelliteModalPreview();
    }
  };

  /**
   * Exposes Safe Zone protective boundary coordinates and radius for Hyperspace kinetic collision
   */
  window.getNomadVehicleSafeZone = function() {
    const el = document.getElementById('vehicle-safe-zone');
    const r = (window.nomadVehicleConfig && window.nomadVehicleConfig.safeZoneRadius) || 68;
    if (!el) {
      const isNorth = (window.cameraPerspectiveMode === 'north-up');
      return {
        x: window.innerWidth / 2,
        y: isNorth ? (window.innerHeight / 2) : (window.innerHeight * 0.62),
        radius: r
      };
    }
    const rect = el.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      radius: r,
      element: el
    };
  };

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.applyVehicleSafeZoneConfig);
  } else {
    window.applyVehicleSafeZoneConfig();
  }

})();
