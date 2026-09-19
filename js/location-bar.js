/**
 * NOMAD V4 HYPERSPACE - Location Channel Bar & Layout Inversion Module
 * /js/location-bar.js
 *
 * Responsibilities:
 * - Location Channel Plaque rendering and street name auto-shrinking
 * - Layout inversion engine (Location Bar at bottom vs top; controls at top vs bottom)
 * - Tap-to-copy Google Maps link with interactive toast
 * - Address abbreviation and state postal code utilities
 */

(function() {
  'use strict';

  window.NomadState = window.NomadState || {};

  // State abbreviations lookup
  window.stateAbbreviations = {
    "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA",
    "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE", "Florida": "FL", "Georgia": "GA",
    "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA",
    "Kansas": "KS", "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
    "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO",
    "Montana": "MT", "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ",
    "New Mexico": "NM", "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH",
    "Oklahoma": "OK", "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
    "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT",
    "Virginia": "VA", "Washington": "WA", "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY"
  };

  /**
   * Formats standard street suffixes into concise abbreviations
   */
  window.abbreviateStreetName = function(streetName) {
    if (!streetName) return '';
    return streetName
      .replace(/\b(?:Route|State Route|State Hwy|SR)\s+(\d{1,3}[A-Z]?)\b/gi, '$1')
      .replace(/\bStreet\b/gi, 'St.')
      .replace(/\bAvenue\b/gi, 'Ave.')
      .replace(/\bBoulevard\b/gi, 'Blvd.')
      .replace(/\bDrive\b/gi, 'Dr.')
      .replace(/\bRoad\b/gi, 'Rd.')
      .replace(/\bLane\b/gi, 'Ln.')
      .replace(/\bCourt\b/gi, 'Ct.')
      .replace(/\bPlace\b/gi, 'Pl.')
      .replace(/\bTerrace\b/gi, 'Ter.')
      .replace(/\bCircle\b/gi, 'Cir.')
      .replace(/\bParkway\b/gi, 'Pkwy.')
      .replace(/\bHighway\b/gi, 'Hwy.')
      .replace(/\bTurnpike\b/gi, 'Tpk.')
      .replace(/\bNorth\b/gi, 'N.')
      .replace(/\bSouth\b/gi, 'S.')
      .replace(/\bEast\b/gi, 'E.')
      .replace(/\bWest\b/gi, 'W.')
      .replace(/\bNortheast\b/gi, 'NE')
      .replace(/\bNorthwest\b/gi, 'NW')
      .replace(/\bSoutheast\b/gi, 'SE')
      .replace(/\bSouthwest\b/gi, 'SW');
  };

  /**
   * Dynamically auto-shrinks street text to prevent overflow within the location pill
   */
  window.autoShrinkStreetName = function() {
    const el = document.getElementById('street-name');
    const card = document.getElementById('location-pill-card') || document.getElementById('location-card');
    if (!el || !card) return;

    const dockedShield = document.getElementById('location-docked-shield');
    const shieldOffset = (dockedShield && dockedShield.style.display !== 'none') ? 44 : 0;
    const maxAllowedWidth = Math.max(120, card.clientWidth - 36 - shieldOffset);
    let fontSize = window.innerWidth < 480 ? 24 : 28;
    el.style.fontSize = `${fontSize}px`;
    const minFontSize = 14;

    while (el.scrollWidth > maxAllowedWidth && fontSize > minFontSize) {
      fontSize -= 1;
      el.style.fontSize = `${fontSize}px`;
    }
  };

  window.addEventListener('resize', window.autoShrinkStreetName);

  // Layout Inversion state persistence
  window.isLayoutInverted = false;
  try {
    window.isLayoutInverted = localStorage.getItem('nomad_layout_inverted') === 'true';
  } catch (_) {}
  window.NomadState.isLayoutInverted = window.isLayoutInverted;

  /**
   * Applies layout inversion mode (Location plaque top vs bottom)
   */
  window.applyLayoutInversion = function(inverted, showToast = false) {
    window.isLayoutInverted = !!inverted;
    window.NomadState.isLayoutInverted = window.isLayoutInverted;
    try {
      localStorage.setItem('nomad_layout_inverted', window.isLayoutInverted ? 'true' : 'false');
    } catch (_) {}

    const dashboard = document.getElementById('main-dashboard');
    if (dashboard) {
      dashboard.classList.toggle('layout-inverted', window.isLayoutInverted);
    }

    // Sync map padding for 3D Take-Off perspective based on layout mode
    if (typeof window.syncMapPadding === 'function') {
      window.syncMapPadding();
    }

    // Clamp kinetic bubbles to avoid landing outside valid visible bounds
    if (window.nomadBubbles) {
      const vh = window.innerHeight;
      const topLimit = window.isLayoutInverted ? 88 : 64;
      const bottomLimit = window.isLayoutInverted ? (vh - 68) : (vh - 108);
      Object.values(window.nomadBubbles).forEach(b => {
        if (!b) return;
        if (b.y < topLimit) b.y = topLimit;
        if (b.y > bottomLimit) b.y = bottomLimit;
      });
    }

    if (showToast && typeof window.showMapThemeToast === 'function') {
      window.showMapThemeToast({
        name: window.isLayoutInverted ? 'Layout: Location Top • Controls Bottom' : 'Layout: Location Bottom • Controls Top',
        type: 'perspective'
      });
    }
  };

  /**
   * Toggles cockpit layout orientation with haptic feedback
   */
  window.toggleCockpitLayout = function() {
    if (navigator.vibrate) {
      try { navigator.vibrate([30, 40, 60]); } catch (_) {}
    }
    window.applyLayoutInversion(!window.isLayoutInverted, true);
  };

  /**
   * Copies Google Maps coordinates link to clipboard with UI feedback
   */
  window.copyLocationLink = function(event) {
    if (event) event.stopPropagation();
    const toastEl = document.getElementById('copy-toast');
    if (window.lastLat === null || window.lastLon === null) {
      if (toastEl) {
        const orig = toastEl.textContent;
        toastEl.textContent = "LOCATING...";
        toastEl.classList.add('show');
        setTimeout(() => {
          toastEl.classList.remove('show');
          setTimeout(() => { toastEl.textContent = orig; }, 250);
        }, 1600);
      }
      return;
    }
    const mapsUrl = `https://www.google.com/maps?q=${window.lastLat},${window.lastLon}`;
    navigator.clipboard.writeText(mapsUrl).then(() => {
      if (toastEl) {
        toastEl.textContent = "COPIED!";
        toastEl.classList.add('show');
        setTimeout(() => { toastEl.classList.remove('show'); }, 1800);
      }
    }).catch(() => {
      if (toastEl) {
        toastEl.textContent = "COPIED!";
        toastEl.classList.add('show');
        setTimeout(() => { toastEl.classList.remove('show'); }, 1800);
      }
    });
  };

})();
