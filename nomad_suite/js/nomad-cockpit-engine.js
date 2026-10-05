/**
 * ====================================================================
 * NOMAD: SUITE — COCKPIT SWITCHER & STARTUP MEMORY ENGINE
 * Unified Multi-Cockpit State, Default Boot Preference, & System Maintenance
 * 
 * Cockpits:
 * 1. 🚗 RoadTrip (v3): Classic high-contrast navigation HUD with MUTCD speed signs
 * 2. 🚀 Hyperspace (v4): Modern kinetic vector canvas with Newtonian data bubbles
 * 3. 📟 DIGIT: Military-grade tactical monospace CRT telemetry matrix
 * 
 * Visionary & Creator: BostonyFX (@neurocosm)
 * Architecture: Pure Decoupled Event-Driven Provider ("Avionics Core")
 * File: /nomad_suite/js/nomad-cockpit-engine.js
 * ====================================================================
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NomadCockpitEngine = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : this), function () {
  'use strict';

  const STORAGE_KEY_DEFAULT = 'nomad_default_cockpit';

  const COCKPITS = [
    {
      id: 'roadtrip',
      name: 'ROAD TRIP',
      subtitle: 'Version 3 Classic',
      file: 'roadtrip.html',
      icon: '🚗',
      accentColor: '#00f3ff',
      tagColor: '#ffb703',
      badge: 'v3 CLASSIC',
      desc: 'High-contrast road navigation HUD with MUTCD speed signs, dual route shields, and 30° tactical rosette compass.'
    },
    {
      id: 'hyperspace',
      name: 'HYPERSPACE',
      subtitle: 'Version 4 Kinetic',
      file: 'hyperspace.html',
      icon: '🚀',
      accentColor: '#ff0055',
      tagColor: '#00d4ff',
      badge: 'v4 HYPERSPACE',
      desc: 'Full-bleed kinetic vector canvas with floating Newtonian data bubbles, 3D perspective pitch, and Galaga/Chevron avatars.'
    },
    {
      id: 'digit',
      name: 'DIGIT',
      subtitle: 'Tactical Monospace',
      file: 'digit.html',
      icon: '📟',
      accentColor: '#30d158',
      tagColor: '#38bdf8',
      badge: 'TACTICAL CRT',
      desc: 'High-density military monospace matrix, ASCII section dividers, and raw tabular telemetry cluster.'
    }
  ];

  // Detect current cockpit from window location
  function getCurrentCockpitId() {
    if (typeof window === 'undefined') return 'hyperspace';
    const path = window.location.pathname.toLowerCase();
    if (path.includes('roadtrip')) return 'roadtrip';
    if (path.includes('digit')) return 'digit';
    if (path.includes('hyperspace')) return 'hyperspace';
    
    // Default boot fallback from localStorage or Hyperspace
    return getDefaultCockpitId();
  }

  function getDefaultCockpitId() {
    if (typeof localStorage === 'undefined') return 'hyperspace';
    try {
      return localStorage.getItem(STORAGE_KEY_DEFAULT) || 'hyperspace';
    } catch (_) {
      return 'hyperspace';
    }
  }

  function setDefaultCockpitId(cockpitId) {
    if (typeof localStorage === 'undefined') return false;
    try {
      if (cockpitId) {
        localStorage.setItem(STORAGE_KEY_DEFAULT, cockpitId);
      } else {
        localStorage.removeItem(STORAGE_KEY_DEFAULT);
      }
      notifySubscribers();
      return true;
    } catch (_) {
      return false;
    }
  }

  function getCockpitById(id) {
    return COCKPITS.find((c) => c.id === id) || COCKPITS[1];
  }

  function switchCockpit(cockpitId) {
    const target = getCockpitById(cockpitId);
    if (!target || typeof window === 'undefined') return;

    // Use replace/assign to smooth transition
    window.location.href = target.file;
  }

  // Hardware-grade Purge Cache & Hard Reload
  async function purgeCacheAndReload() {
    if (typeof window === 'undefined') return;

    try {
      // 1. Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }

      // 2. Clear Cache Storage
      if ('caches' in window) {
        const keys = await caches.keys();
        for (const key of keys) {
          await caches.delete(key);
        }
      }

      // 3. Clear transient storage keys (preserve default cockpit preference)
      if (typeof localStorage !== 'undefined') {
        const savedDefault = localStorage.getItem(STORAGE_KEY_DEFAULT);
        const savedVersion = localStorage.getItem('nomad_remote_version');
        localStorage.clear();
        if (savedDefault) localStorage.setItem(STORAGE_KEY_DEFAULT, savedDefault);
        if (savedVersion) localStorage.setItem('nomad_remote_version', savedVersion);
      }

      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
    } catch (e) {
      console.warn('Purge warning:', e);
    }

    // 4. Force hard reload from server
    window.location.reload(true);
  }

  // Subscribers for reactive state
  const subscribers = [];
  function notifySubscribers() {
    const state = getState();
    for (let i = 0; i < subscribers.length; i++) {
      try {
        subscribers[i](state);
      } catch (err) {
        console.error('NomadCockpitEngine subscriber error:', err);
      }
    }
  }

  function getState() {
    return {
      currentId: getCurrentCockpitId(),
      defaultId: getDefaultCockpitId(),
      cockpits: COCKPITS,
      storageKey: STORAGE_KEY_DEFAULT
    };
  }

  return {
    getCockpits: () => [...COCKPITS],
    getCockpitById,
    getCurrentCockpitId,
    getDefaultCockpitId,
    setDefaultCockpitId,
    switchCockpit,
    purgeCacheAndReload,
    getState,
    onUpdate: (cb) => {
      subscribers.push(cb);
      try { cb(getState()); } catch (_) {}
      return () => {
        const idx = subscribers.indexOf(cb);
        if (idx !== -1) subscribers.splice(idx, 1);
      };
    }
  };
}));
