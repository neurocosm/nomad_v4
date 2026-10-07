/**
 * ====================================================================
 * NOMAD: SUITE — UNIFIED VEHICLE PERSONA & ACOUSTIC ENGINE
 * Shared Between RoadTrip & Hyperspace (+ Tactile Audio for DIGIT)
 * 
 * Visionary & Creator: BostonyFX (@tony_bostony)
 * Features: Cruise Chevron, Neon Galaga Fighter, F-117 Stealth Slate,
 * Dixie Horn Synthesizer, 8-Bit Laser Peashooter, Bluetooth Keep-Alive
 * File: /nomad_suite/js/nomad-vehicle-engine.js
 * ====================================================================
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const exports = factory();
    root.NomadVehicleEngine = exports.NomadVehicleEngine;
    root.NomadAudioEngine = exports.NomadAudioEngine;
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ====================================================================
  // 1. ACOUSTIC ENGINE (Web Audio Synthesizer & Bluetooth Keep-Alive)
  // ====================================================================
  let audioCtx = null;
  let keepAliveInterval = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  // Pre-warm audio context on first user interaction
  if (typeof window !== 'undefined') {
    const preWarm = () => {
      getAudioContext();
      window.removeEventListener('touchstart', preWarm);
      window.removeEventListener('mousedown', preWarm);
      window.removeEventListener('keydown', preWarm);
    };
    window.addEventListener('touchstart', preWarm, { passive: true });
    window.addEventListener('mousedown', preWarm, { passive: true });
    window.addEventListener('keydown', preWarm, { passive: true });
  }

  function unlockAudio(ctx) {
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    try {
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
    } catch (_) {}
  }

  function playTone(freq = 1000, duration = 0.05, type = 'sine', volume = 0.15) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      unlockAudio(ctx);
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn('Audio playTone error:', e);
    }
  }

  function playArcadeChirp(isActivation = true) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      unlockAudio(ctx);
      const now = ctx.currentTime;
      const notes = isActivation
        ? [[659.25, 0.045], [880.00, 0.045], [1046.50, 0.045], [1318.51, 0.060]]
        : [[1318.51, 0.045], [987.77, 0.045], [783.99, 0.060]];

      let offset = 0;
      notes.forEach(([freq, dur]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + offset);
        gain.gain.setValueAtTime(0.12, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + dur);
        offset += dur * 0.9;
      });
    } catch (e) {
      console.warn('Audio playArcadeChirp error:', e);
    }
  }

  function playDixieHorn(onComplete) {
    try {
      const ctx = getAudioContext();
      if (!ctx) {
        if (typeof onComplete === 'function') setTimeout(onComplete, 2820);
        return 2820;
      }
      unlockAudio(ctx);

      const now = ctx.currentTime + 0.05;
      const dixieNotes = [
        [392.00, 0.16], [329.63, 0.16], [261.63, 0.22], [261.63, 0.12],
        [261.63, 0.16], [293.66, 0.16], [329.63, 0.16], [349.23, 0.16],
        [392.00, 0.24], [392.00, 0.24], [392.00, 0.24], [329.63, 0.45]
      ];

      let offset = 0;
      let totalDuration = 0;

      dixieNotes.forEach(([freq, dur], index) => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'square';
        osc1.frequency.setValueAtTime(freq, now + offset);
        osc2.frequency.setValueAtTime(freq * 1.004, now + offset);

        gain.gain.setValueAtTime(0.24, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + dur);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now + offset);
        osc2.start(now + offset);
        osc1.stop(now + offset + dur);
        osc2.stop(now + offset + dur);

        if (index === dixieNotes.length - 1) totalDuration = (offset + dur) * 1000;
        offset += dur * 0.95;
      });

      const exactDuration = Math.max(totalDuration, 2820);
      if (typeof onComplete === 'function') {
        setTimeout(onComplete, exactDuration);
      }
      return exactDuration;
    } catch (e) {
      console.warn('Audio playDixieHorn error:', e);
      if (typeof onComplete === 'function') setTimeout(onComplete, 2820);
      return 2820;
    }
  }

  function playGalagaLaser(onComplete) {
    try {
      const ctx = getAudioContext();
      if (!ctx) {
        if (typeof onComplete === 'function') setTimeout(onComplete, 805);
        return 805;
      }
      unlockAudio(ctx);

      const now = ctx.currentTime + 0.03;
      const salvos = [[0.00, 0.09], [0.32, 0.41], [0.64, 0.73]];

      salvos.forEach(([t1, t2]) => {
        [t1, t2].forEach((delay) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(1750, now + delay);
          osc.frequency.exponentialRampToValueAtTime(120, now + delay + 0.075);
          gain.gain.setValueAtTime(0.25, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.075);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + delay);
          osc.stop(now + delay + 0.075);
        });
      });

      const exactDuration = 805;
      if (typeof onComplete === 'function') {
        setTimeout(onComplete, exactDuration);
      }
      return exactDuration;
    } catch (e) {
      console.warn('Audio playGalagaLaser error:', e);
      if (typeof onComplete === 'function') setTimeout(onComplete, 805);
      return 805;
    }
  }

  // Bluetooth A2DP Keep-Alive: Plays sub-audible carrier ping to prevent receiver sleep
  function initBluetoothKeepAlive() {
    if (keepAliveInterval) return;
    keepAliveInterval = setInterval(() => {
      try {
        const ctx = getAudioContext();
        if (!ctx || ctx.state !== 'running') return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(20, now); // 20Hz sub-audible
        gain.gain.setValueAtTime(0.0008, now);
        gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      } catch (_) {}
    }, 45000); // Pulse every 45s
  }

  const NomadAudioEngine = {
    getContext: getAudioContext,
    unlock: () => unlockAudio(getAudioContext()),
    playTone,
    playArcadeChirp,
    playDixieHorn,
    playGalagaLaser,
    initBluetoothKeepAlive
  };

  // ====================================================================
  // 2. VEHICLE PERSONA ENGINE (Chevron, Neon Galaga, F-117 Stealth)
  // ====================================================================
  const STORAGE_KEY_VEHICLE = 'nomad_vehicle_mode';
  let currentVehicleMode = 'chevron';

  try {
    const saved = localStorage.getItem(STORAGE_KEY_VEHICLE);
    if (saved === 'galaga' || saved === 'chevron') {
      currentVehicleMode = saved;
    }
  } catch (e) {}

  const vehicleSubscribers = [];

  function getMode() {
    return currentVehicleMode;
  }

  function setMode(newMode, silent = false) {
    if (newMode !== 'chevron' && newMode !== 'galaga') return;
    const changed = (currentVehicleMode !== newMode);
    currentVehicleMode = newMode;

    try {
      localStorage.setItem(STORAGE_KEY_VEHICLE, newMode);
    } catch (_) {}

    if (!silent && changed) {
      playArcadeChirp(newMode === 'galaga');
    }

    // Notify subscribers
    for (let i = 0; i < vehicleSubscribers.length; i++) {
      try {
        vehicleSubscribers[i](currentVehicleMode);
      } catch (err) {
        console.error(err);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nomad-vehicle-change', { detail: { mode: currentVehicleMode } }));
    }
  }

  function toggleMode() {
    setMode(currentVehicleMode === 'chevron' ? 'galaga' : 'chevron');
    return currentVehicleMode;
  }

  function onModeChange(callback) {
    if (typeof callback !== 'function') return () => {};
    vehicleSubscribers.push(callback);
    callback(currentVehicleMode);
    return function unsubscribe() {
      const idx = vehicleSubscribers.indexOf(callback);
      if (idx !== -1) vehicleSubscribers.splice(idx, 1);
    };
  }

  // --- SVG Vector Generators ---

  function getChevronSvgMarkup(options = {}) {
    const size = options.size || 32;
    const color = options.color || '#007aff';
    const stroke = options.stroke || '#ffffff';
    const strokeWidth = options.strokeWidth || 2;
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" style="overflow: visible; filter: drop-shadow(0px 2px 5px rgba(0,0,0,0.6)); display: block;">
        <polygon points="12 2 19 21 12 17 5 21 12 2" />
      </svg>
    `.trim();
  }

  function getGalagaFighterSvgMarkup(options = {}) {
    const size = options.size || 36;
    const isLight = Boolean(options.isLight);

    if (isLight) {
      // F-117 Stealth Slate Fighter for Light Navigation
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 32 32" style="overflow: visible; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.65)); display: block;">
          <!-- Main Stealth Fuselage (F-117 Matte Jet Black / Charcoal) -->
          <polygon points="16,1 19,10 19,26 13,26 13,10" fill="#1e242f" stroke="#0a0d14" stroke-width="0.9"/>
          <!-- Stealth Nose Radome (Crimson Radar) -->
          <polygon points="16,1 18,8 14,8" fill="#d90429"/>
          <!-- Left Wing & Chined Edge (Tactical Dark Slate) -->
          <polygon points="13,10 13,25 2,26 6,17" fill="#2d3748" stroke="#111827" stroke-width="0.7"/>
          <!-- Left Wing Tip (Infrared Dark Red) -->
          <polygon points="2,26 6,17 2,15" fill="#9b111e"/>
          <!-- Right Wing & Chined Edge (Tactical Dark Slate) -->
          <polygon points="19,10 19,25 30,26 26,17" fill="#2d3748" stroke="#111827" stroke-width="0.7"/>
          <!-- Right Wing Tip (Infrared Dark Red) -->
          <polygon points="30,26 26,17 30,15" fill="#9b111e"/>
          <!-- Afterburner / Low-RCS Exhaust Plume (Amber) -->
          <rect x="14" y="26" width="4" height="4" fill="#ff9100" stroke="#b45309" stroke-width="0.5"/>
        </svg>
      `.trim();
    } else {
      // Authentic Retro Neon Arcade Galaga Fighter for Dark Navigation
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 32 32" style="overflow: visible; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.65)); display: block;">
          <!-- Main Fuselage (Arcade White) -->
          <polygon points="16,1 19,10 19,26 13,26 13,10" fill="#ffffff" stroke="#000000" stroke-width="0.8"/>
          <!-- Nose Cone (Magenta) -->
          <polygon points="16,1 18,8 14,8" fill="#ff0044"/>
          <!-- Left Wing (Neon Cyan) -->
          <polygon points="13,10 13,25 2,26 6,17" fill="#00d4ff"/>
          <!-- Left Wing Tip (Magenta) -->
          <polygon points="2,26 6,17 2,15" fill="#ff0044"/>
          <!-- Right Wing (Neon Cyan) -->
          <polygon points="19,10 19,25 30,26 26,17" fill="#00d4ff"/>
          <!-- Right Wing Tip (Magenta) -->
          <polygon points="30,26 26,17 30,15" fill="#ff0044"/>
          <!-- Twin Afterburner (Arcade Yellow) -->
          <rect x="14" y="26" width="4" height="4" fill="#ffcc00"/>
        </svg>
      `.trim();
    }
  }

  function getVehicleSvg(mode = currentVehicleMode, isLight = false, options = {}) {
    if (mode === 'galaga') {
      return getGalagaFighterSvgMarkup({ ...options, isLight });
    }
    return getChevronSvgMarkup(options);
  }

  function getGeneralLeeSvgMarkup(options = {}) {
    const width = options.width || 68;
    const height = options.height || 34;
    return `
      <svg viewBox="0 0 94 46" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" style="width: ${width}px; height: ${height}px; max-width: 90%; max-height: 88%; overflow: visible; display: block; margin: auto; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6));">
        <path d="M 12 0 L 34 0 L 46 12 L 46 34 L 34 46 L 12 46 L 0 34 L 0 12 Z M 15 12 L 15 34 L 31 34 L 31 12 Z" fill="#000000" stroke="#ffffff" stroke-width="3.2" stroke-linejoin="miter" fill-rule="evenodd" />
        <path d="M 64 12 L 54 20 L 54 12 L 68 0 L 78 0 L 78 36 L 94 36 L 94 46 L 54 46 L 54 36 L 68 36 L 68 12 Z" fill="#000000" stroke="#ffffff" stroke-width="3.2" stroke-linejoin="miter" />
      </svg>
    `.trim();
  }

  // Safe Zone Boundary Calculation (Used by Hyperspace kinetic bubble deflection)
  function getSafeZone(containerW, containerH, isPerspective = true) {
    const w = containerW || (typeof window !== 'undefined' ? window.innerWidth : 400);
    const h = containerH || (typeof window !== 'undefined' ? window.innerHeight : 800);
    const cx = w * 0.5;
    // In driving perspective mode, vehicle is elevated to 62% of viewport; in 2D it is centered at 50%
    const cy = isPerspective ? (h * 0.62) : (h * 0.50);
    const radius = currentVehicleMode === 'galaga' ? 54 : 46;

    return {
      cx,
      cy,
      radius,
      mode: currentVehicleMode,
      diameter: radius * 2
    };
  }

  const NomadVehicleEngine = {
    getMode,
    setMode,
    toggleMode,
    onModeChange,
    subscribe: onModeChange,
    getChevronSvg: getChevronSvgMarkup,
    getGalagaFighterSvg: getGalagaFighterSvgMarkup,
    getGeneralLeeSvg: getGeneralLeeSvgMarkup,
    getVehicleSvg,
    getSafeZone
  };

  return {
    NomadVehicleEngine,
    NomadAudioEngine
  };
}));
