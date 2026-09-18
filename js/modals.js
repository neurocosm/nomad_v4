/**
 * NOMAD V4 HYPERSPACE - Modals Management Module
 * /js/modals.js
 *
 * Responsibilities:
 * - About / Version Registry / PWA Install modal
 * - Weather Update & Sync Intervals modal
 * - Hyperspace Kinetic Bubbles Configuration modal
 * - Universal keyboard Escape and backdrop tap-to-dismiss handlers
 */

(function() {
  'use strict';

  window.weatherTimeIntervalMinutes = parseInt(localStorage.getItem('nomad_weather_interval_min') || '30', 10);
  window.weatherDistanceIntervalMiles = parseInt(localStorage.getItem('nomad_weather_distance_mi') || '15', 10);

  /**
   * Opens the About / Version Registry Modal
   */
  window.openAboutModal = function() {
    const modal = document.getElementById('about-modal');
    if (modal) {
      if (typeof window.applyNomadRegistry === 'function') window.applyNomadRegistry();
      const ver = window.NOMAD_VERSION || 'v4';
      const heroVer = document.getElementById('nomad-modal-version-hero');
      if (heroVer) heroVer.textContent = ver;
      const tagVer = document.getElementById('nomad-modal-version');
      if (tagVer) tagVer.textContent = ver;

      // Show PWA install button if the browser prompt is ready
      const installBtn = document.getElementById('modal-pwa-install-btn');
      if (installBtn) {
        installBtn.style.display = (window.deferredInstallPrompt) ? 'flex' : 'none';
      }

      modal.classList.add('active');
    }
  };

  /**
   * Closes the About Modal
   */
  window.closeAboutModal = function(event) {
    if (event) event.stopPropagation();
    const modal = document.getElementById('about-modal');
    if (modal) modal.classList.remove('active');
  };

  /**
   * Syncs active pill states in the weather interval modal
   */
  window.renderWeatherModalPills = function() {
    const modal = document.getElementById('weather-modal');
    if (!modal) return;
    const timeBtns = modal.querySelectorAll('#time-pill-grid .config-pill-btn');
    timeBtns.forEach(btn => {
      const val = parseInt(btn.innerText, 10);
      btn.classList.toggle('active', val === window.weatherTimeIntervalMinutes);
    });
    const distBtns = modal.querySelectorAll('#distance-pill-grid .config-pill-btn');
    distBtns.forEach(btn => {
      const val = btn.innerText === 'Off' ? 0 : parseInt(btn.innerText, 10);
      btn.classList.toggle('active', val === window.weatherDistanceIntervalMiles);
    });
  };

  /**
   * Opens the Weather Sync Intervals Modal
   */
  window.openWeatherModal = function() {
    window.renderWeatherModalPills();
    const modal = document.getElementById('weather-modal');
    if (!modal) return;
    modal.classList.add('active');
  };

  /**
   * Closes the Weather Modal
   */
  window.closeWeatherModal = function(event) {
    if (event) event.stopPropagation();
    const modal = document.getElementById('weather-modal');
    if (modal) modal.classList.remove('active');
  };

  /**
   * Configures time interval for weather updates
   */
  window.setWeatherTimeInterval = function(minutes) {
    window.weatherTimeIntervalMinutes = minutes;
    localStorage.setItem('nomad_weather_interval_min', minutes);
    window.renderWeatherModalPills();
  };

  /**
   * Configures distance interval for weather updates
   */
  window.setWeatherDistanceInterval = function(miles) {
    window.weatherDistanceIntervalMiles = miles;
    localStorage.setItem('nomad_weather_distance_mi', miles);
    window.renderWeatherModalPills();
  };

  /**
   * Opens the Hyperspace Kinetic Bubbles Configuration Modal
   */
  window.openKineticBubbleModal = function(bubbleKey) {
    const modal = document.getElementById('kinetic-bubble-modal');
    if (!modal) return;
    if (bubbleKey && typeof window.switchBubbleTab === 'function') {
      window.switchBubbleTab(bubbleKey);
    } else if (typeof window.syncBubbleModalWithState === 'function') {
      window.syncBubbleModalWithState();
    }
    modal.classList.add('active');
  };

  /**
   * Closes the Hyperspace Kinetic Bubbles Configuration Modal
   */
  window.closeKineticBubbleModal = function(event) {
    if (event) event.stopPropagation();
    const modal = document.getElementById('kinetic-bubble-modal');
    if (modal) modal.classList.remove('active');
  };

  // Keyboard Escape listener to dismiss any active modal
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' || e.keyCode === 27) {
      document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    }
  });

})();
