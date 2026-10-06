/**
 * ====================================================================
 * NOMAD: SMART CONTEXT-AWARE NAVIGATION & RETURN ROUTER
 * Remembers calling cockpit and returns seamlessly across the suite
 * 
 * Visionary & Creator: BostonyFX (@neurocosm)
 * File: /js/nomad-return.js
 * ====================================================================
 */
(function(root) {
  'use strict';

  // 1. Record current cockpit if this page is a cockpit or launcher
  try {
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('roadtrip.html') || path.endsWith('/roadtrip')) {
        sessionStorage.setItem('nomad_active_hud', 'roadtrip.html');
        sessionStorage.setItem('nomad_active_hud_name', 'ROAD TRIP');
      } else if (path.includes('digit.html') || path.endsWith('/digit')) {
        sessionStorage.setItem('nomad_active_hud', 'digit.html');
        sessionStorage.setItem('nomad_active_hud_name', 'DIGIT');
      } else if (path.includes('hyperspace.html') || path.endsWith('/hyperspace')) {
        sessionStorage.setItem('nomad_active_hud', 'hyperspace.html');
        sessionStorage.setItem('nomad_active_hud_name', 'HYPERSPACE');
      } else if (path.includes('nomad_suite')) {
        sessionStorage.setItem('nomad_active_hud', 'nomad_suite/');
        sessionStorage.setItem('nomad_active_hud_name', 'START HUD');
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
          if (fromParam.includes('launcher') || fromParam.includes('suite')) return { target: 'nomad_suite/', name: 'START HUD' };
        }

        if (typeof sessionStorage !== 'undefined') {
          const storedHud = sessionStorage.getItem('nomad_active_hud');
          const storedName = sessionStorage.getItem('nomad_active_hud_name');
          if (storedHud) {
            return { target: storedHud, name: storedName || 'COCKPIT' };
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
          if (ref.includes('nomad_suite')) return { target: 'nomad_suite/', name: 'START HUD' };
        }
      }
    } catch (_) {}

    return { target: 'hyperspace.html', name: 'NAV' };
  }

  function returnToActiveHUD() {
    const info = getNomadReturnTarget();
    if (typeof window !== 'undefined') {
      window.location.href = info.target;
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
    setupReturnButtons: setupReturnButtons
  };
  root.returnToActiveHUD = returnToActiveHUD;
})(typeof globalThis !== 'undefined' ? globalThis : this);
