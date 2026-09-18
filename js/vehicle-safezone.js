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
   * Exposes Safe Zone protective boundary coordinates and radius for Hyperspace kinetic collision
   */
  window.getNomadVehicleSafeZone = function() {
    const el = document.getElementById('vehicle-safe-zone');
    if (!el) {
      const isNorth = (window.cameraPerspectiveMode === 'north-up');
      return {
        x: window.innerWidth / 2,
        y: isNorth ? (window.innerHeight / 2) : (window.innerHeight * 0.62),
        radius: 68
      };
    }
    const rect = el.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      radius: (rect.width / 2) || 68,
      element: el
    };
  };

})();
