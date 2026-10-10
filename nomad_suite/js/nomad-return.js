/**
 * ====================================================================
 * NOMAD: SMART CONTEXT-AWARE NAVIGATION & RETURN ROUTER
 * Remembers calling cockpit and returns seamlessly across the suite
 * 
 * Visionary & Creator: BostonyFX
 * File: /js/nomad-return.js
 * ====================================================================
 */
(function(root) {
  'use strict';

  // 1. Record current cockpit if this page is a cockpit or launcher
  try {
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      const path = (window.location.pathname || '').toLowerCase();
      if (path.includes('roadtrip.html') || path.endsWith('/roadtrip')) {
        sessionStorage.setItem('nomad_active_hud', 'roadtrip.html');
        sessionStorage.setItem('nomad_active_hud_name', 'ROAD TRIP');
      } else if (path.includes('digit.html') || path.endsWith('/digit')) {
        sessionStorage.setItem('nomad_active_hud', 'digit.html');
        sessionStorage.setItem('nomad_active_hud_name', 'DIGIT');
      } else if (path.includes('hyperspace.html') || path.endsWith('/hyperspace')) {
        sessionStorage.setItem('nomad_active_hud', 'hyperspace.html');
        sessionStorage.setItem('nomad_active_hud_name', 'HYPERSPACE');
      } else if (path.includes('launch.html') || path.endsWith('/launch') || path.includes('launcher')) {
        sessionStorage.setItem('nomad_active_hud', 'launch.html');
        sessionStorage.setItem('nomad_active_hud_name', 'LAUNCH CONTROL');
      } else if (path.includes('nomad_suite') && (path.endsWith('/') || path.endsWith('index.html'))) {
        sessionStorage.setItem('nomad_active_hud', 'launch.html');
        sessionStorage.setItem('nomad_active_hud_name', 'LAUNCH CONTROL');
      } else if (path.endsWith('/') || path.endsWith('index.html')) {
        sessionStorage.setItem('nomad_active_hud', 'hyperspace.html');
        sessionStorage.setItem('nomad_active_hud_name', 'HYPERSPACE');
      }
    }
  } catch (_) {}

  // 2. Resolve return target
  function getNomadReturnTarget() {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const fromParam = (params.get('from') || '').toLowerCase();
        if (fromParam) {
          if (fromParam.includes('roadtrip')) return { target: 'roadtrip.html', name: 'ROAD TRIP' };
          if (fromParam.includes('digit')) return { target: 'digit.html', name: 'DIGIT' };
          if (fromParam.includes('hyperspace')) return { target: 'hyperspace.html', name: 'HYPERSPACE' };
          if (fromParam.includes('launcher') || fromParam.includes('suite') || fromParam.includes('home')) {
            return { target: 'launch.html', name: 'LAUNCH CONTROL' };
          }
        }

        if (typeof sessionStorage !== 'undefined') {
          let storedHud = sessionStorage.getItem('nomad_active_hud');
          let storedName = sessionStorage.getItem('nomad_active_hud_name');

          // Scrub any legacy 'nomad_suite/' or 'START HUD'
          if (storedHud) {
            if (storedHud.includes('nomad_suite') || storedHud === 'nomad_suite/' || storedHud === 'nomad_suite' || storedHud === 'index.html') {
              storedHud = (storedName === 'LAUNCH CONTROL') ? 'launch.html' : 'hyperspace.html';
              sessionStorage.setItem('nomad_active_hud', storedHud);
            }
            if (storedName === 'START HUD' || !storedName || storedName.includes('nomad_suite')) {
              storedName = (storedHud === 'launch.html') ? 'LAUNCH CONTROL' : 'COCKPIT';
              sessionStorage.setItem('nomad_active_hud_name', storedName);
            }
            return { target: storedHud, name: storedName };
          }
        }

        if (typeof localStorage !== 'undefined') {
          const defCockpit = localStorage.getItem('nomad_default_cockpit');
          if (defCockpit === 'roadtrip') return { target: 'roadtrip.html', name: 'ROAD TRIP' };
          if (defCockpit === 'digit') return { target: 'digit.html', name: 'DIGIT' };
          if (defCockpit === 'hyperspace') return { target: 'hyperspace.html', name: 'HYPERSPACE' };
        }

        if (typeof document !== 'undefined' && document.referrer) {
          const ref = document.referrer.toLowerCase();
          if (ref.includes('roadtrip.html')) return { target: 'roadtrip.html', name: 'ROAD TRIP' };
          if (ref.includes('digit.html')) return { target: 'digit.html', name: 'DIGIT' };
          if (ref.includes('hyperspace.html')) return { target: 'hyperspace.html', name: 'HYPERSPACE' };
          if (ref.includes('launch.html') || ref.includes('nomad_suite')) return { target: 'launch.html', name: 'LAUNCH CONTROL' };
        }
      }
    } catch (_) {}

    return { target: 'launch.html', name: 'LAUNCH CONTROL' };
  }

  function returnToActiveHUD() {
    const info = getNomadReturnTarget();
    if (typeof window !== 'undefined') {
      window.location.href = info.target;
    }
  }

  // Explicit return directly to Launch Control Home
  function returnToNomadLauncher(e) {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    if (typeof window !== 'undefined') {
      window.location.href = 'launch.html';
    }
  }

  function setupReturnButtons() {
    if (typeof document === 'undefined') return;
    const info = getNomadReturnTarget();
    
    // Wire all explicit return buttons
    document.querySelectorAll('[data-nomad-return-btn], .btn-return, .btn-back-nomad, #btn-return-nav, #btn-back-cockpit').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        returnToActiveHUD();
      };
      if (btn.hasAttribute('data-nomad-dynamic-text') || btn.classList.contains('btn-return') || btn.id === 'btn-return-nav') {
        btn.innerText = `< RETURN TO ${info.name}`;
      } else if (btn.id === 'btn-back-cockpit' || btn.classList.contains('btn-back-nomad')) {
        // Keep icon if present
        const svg = btn.querySelector('svg');
        if (svg) {
          btn.innerHTML = '';
          btn.appendChild(svg);
          btn.append(` BACK TO ${info.name}`);
        } else {
          btn.innerText = `BACK TO ${info.name}`;
        }
      }
    });

    // Wire any home / launcher buttons
    document.querySelectorAll('.modal-home-launcher-btn, [data-nomad-launcher-btn]').forEach(btn => {
      btn.onclick = (e) => {
        returnToNomadLauncher(e);
      };
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupReturnButtons);
    } else {
      setupReturnButtons();
    }
  }

  root.NomadReturnRouter = {
    getTarget: getNomadReturnTarget,
    returnToActiveHUD: returnToActiveHUD,
    returnToNomadLauncher: returnToNomadLauncher,
    setupReturnButtons: setupReturnButtons
  };
  root.returnToActiveHUD = returnToActiveHUD;
  root.returnToNomadLauncher = returnToNomadLauncher;
  root.returnToLaunch = returnToNomadLauncher;
  if (typeof window !== 'undefined') {
    window.returnToNomadLauncher = returnToNomadLauncher;
    window.returnToLaunch = returnToNomadLauncher;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
