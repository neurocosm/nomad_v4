/**
 * ====================================================================
 * NOMAD: SUITE — SENSORY VISUALIZERS & KINETIC CONSOLES ENGINE
 * "The Fidget Arcade" & 60-Second Auto-Cycling Countdown Die
 * 
 * Consoles:
 * 1. Starfield Warp Drive (Relativistic warp stars, coronal flares)
 * 2. Underwater Ocean (Marine caustics, rising bubbles, tropical fish)
 * 3. Synthomatic PCB (Hero DSP 8800 chip, 16MHz Quartz Crystal, Sound ROM)
 * 4. Stampede (Western desert canyon stars, dust clouds, saguaro cacti)
 * 
 * Interactive Countdown Die:
 * - Crisp white Face 5 during manual browsing (never counts or shifts on taps)
 * - 700ms long-press turns vibrant yellow (#ffb703) and starts 60s countdown
 * - 60-second cycle: 6 -> 5 -> 4 -> 3 -> 2 -> 1
 * - 9th-second snap spin: rotates 180° with elastic bounce, morphs pips at 420ms
 * - Second 60: switches to next console, resets die to 6, repeats
 * 
 * Visionary & Creator: BostonyFX
 * Architecture: Pure Decoupled Event-Driven Provider ("Sensory Core")
 * File: /nomad_suite/js/nomad-fidget-engine.js
 * ====================================================================
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NomadFidgetEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // --- Console Definitions ---
  const CONSOLES = [
    {
      id: 'starfield',
      name: 'Starfield Warp Drive',
      shortName: 'STARFIELD',
      icon: '✨',
      accentColor: '#00f3ff',
      tagline: 'Deep space hyperspace warp stars with speed-reactive coronal flaring'
    },
    {
      id: 'underwater',
      name: 'Underwater Ocean',
      shortName: 'UNDERWATER',
      icon: '🐠',
      accentColor: '#38bdf8',
      tagline: 'Marine caustic fluid physics, rising bubbles & undulating tropical fish'
    },
    {
      id: 'kitt',
      name: 'Synthomatic DSP Circuit Board',
      shortName: 'SYNTHOMATIC',
      icon: '⚡',
      accentColor: '#ffb703',
      tagline: 'Hero SYNTH-DSP 8800 chip, 16MHz Quartz, Sound ROM & regenerative surge'
    },
    {
      id: 'stampede',
      name: 'Desert Canyon Stampede',
      shortName: 'STAMPEDE',
      icon: '🏜️',
      accentColor: '#ff7700',
      tagline: 'Canyon celestial night stars, dust trails, giant saguaro & running wild herds'
    }
  ];

  // State
  let activeConsoleIndex = 0;
  let currentDieFace = 5; // Rule: Must remain 5 during manual browsing
  let isAutoCycling = false;
  let elapsedSeconds = 0;
  let countdownTimerId = null;
  let containerElement = null;
  let canvasElement = null;

  // Subscribers
  const consoleSubscribers = [];
  const dieSubscribers = [];
  const tickSubscribers = [];

  // Pips SVG Generator
  function getDiePipsSvg(face) {
    switch (face) {
      case 1:
        return '<circle cx="12" cy="12" r="2.0" fill="currentColor"/>';
      case 2:
        return `
          <circle cx="7.2" cy="7.2" r="1.5" fill="currentColor"/>
          <circle cx="16.8" cy="16.8" r="1.5" fill="currentColor"/>
        `;
      case 3:
        return `
          <circle cx="7.2" cy="7.2" r="1.5" fill="currentColor"/>
          <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
          <circle cx="16.8" cy="16.8" r="1.5" fill="currentColor"/>
        `;
      case 4:
        return `
          <circle cx="7.2" cy="7.2" r="1.5" fill="currentColor"/>
          <circle cx="16.8" cy="7.2" r="1.5" fill="currentColor"/>
          <circle cx="7.2" cy="16.8" r="1.5" fill="currentColor"/>
          <circle cx="16.8" cy="16.8" r="1.5" fill="currentColor"/>
        `;
      case 6:
        return `
          <circle cx="7.2" cy="6.2" r="1.4" fill="currentColor"/>
          <circle cx="16.8" cy="6.2" r="1.4" fill="currentColor"/>
          <circle cx="7.2" cy="12" r="1.4" fill="currentColor"/>
          <circle cx="16.8" cy="12" r="1.4" fill="currentColor"/>
          <circle cx="7.2" cy="17.8" r="1.4" fill="currentColor"/>
          <circle cx="16.8" cy="17.8" r="1.4" fill="currentColor"/>
        `;
      case 5:
      default:
        return `
          <circle cx="7.2" cy="7.2" r="1.5" fill="currentColor"/>
          <circle cx="16.8" cy="7.2" r="1.5" fill="currentColor"/>
          <circle cx="12" cy="12" r="1.55" fill="currentColor"/>
          <circle cx="7.2" cy="16.8" r="1.5" fill="currentColor"/>
          <circle cx="16.8" cy="16.8" r="1.5" fill="currentColor"/>
        `;
    }
  }

  function getDieSvg(face = currentDieFace, autoCycleActive = isAutoCycling) {
    const activeFace = (autoCycleActive) ? (face || 6) : 5;
    const colorClass = autoCycleActive ? 'auto-cycling-die' : 'manual-die';
    const color = autoCycleActive ? '#ffb703' : '#ffffff';

    return `
      <svg class="nomad-dice-svg ${colorClass}" id="nomad-dice-svg" viewBox="0 0 24 24" fill="none" style="width: 100%; height: 100%; color: ${color}; overflow: visible;">
        <rect x="2.5" y="2.5" width="19" height="19" rx="4.5" ry="4.5" fill="rgba(8, 14, 26, 0.6)" stroke="currentColor" stroke-width="1.8"/>
        <g id="nomad-dice-pips" style="color: ${color};">
          ${getDiePipsSvg(activeFace)}
        </g>
      </svg>
    `;
  }

  // --- Snap Spin Animation Handler ---
  function triggerDieSnapSpin(targetFace, callback) {
    const diceSvg = document.getElementById('nomad-dice-svg');
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(18); } catch (e) {}
    }

    if (diceSvg) {
      diceSvg.classList.remove('snap-spinning');
      void diceSvg.offsetWidth; // Force reflow
      diceSvg.classList.add('snap-spinning');

      // Swap pips halfway through the 850ms spin (at 420ms, rotated 180°)
      setTimeout(() => {
        currentDieFace = targetFace;
        const pipsEl = document.getElementById('nomad-dice-pips');
        if (pipsEl) {
          pipsEl.innerHTML = getDiePipsSvg(targetFace);
        }
        emitDieStateChange();
        if (typeof callback === 'function') callback(targetFace);
      }, 420);

      setTimeout(() => {
        if (diceSvg) diceSvg.classList.remove('snap-spinning');
      }, 880);
    } else {
      currentDieFace = targetFace;
      emitDieStateChange();
      if (typeof callback === 'function') callback(targetFace);
    }
  }

  // --- 60-Second Auto-Cycle Timer ---
  function startAutoCycle() {
    stopAutoCycle();
    isAutoCycling = true;
    elapsedSeconds = 0;
    currentDieFace = 6;

    emitDieStateChange();
    emitTick();

    countdownTimerId = setInterval(() => {
      elapsedSeconds++;
      emitTick();

      // 9th-Second Snap Spin Synchronizer:
      // Snap spin fires right on the 9th second of each 10s step:
      // Sec 9 -> Morph to 5 (at 420ms)
      // Sec 19 -> Morph to 4
      // Sec 29 -> Morph to 3
      // Sec 39 -> Morph to 2
      // Sec 49 -> Morph to 1
      // Sec 59 -> Morph to 6
      if (elapsedSeconds === 9) {
        triggerDieSnapSpin(5);
      } else if (elapsedSeconds === 19) {
        triggerDieSnapSpin(4);
      } else if (elapsedSeconds === 29) {
        triggerDieSnapSpin(3);
      } else if (elapsedSeconds === 39) {
        triggerDieSnapSpin(2);
      } else if (elapsedSeconds === 49) {
        triggerDieSnapSpin(1);
      } else if (elapsedSeconds === 59) {
        triggerDieSnapSpin(6);
      } else if (elapsedSeconds >= 60) {
        // At second 60: advance to next fidget scene, reset die to 6, and restart countdown
        rotateNextConsole(true);
      }
    }, 1000);
  }

  function stopAutoCycle() {
    if (countdownTimerId !== null) {
      clearInterval(countdownTimerId);
      countdownTimerId = null;
    }
    isAutoCycling = false;
    elapsedSeconds = 0;
    currentDieFace = 5; // Rule: Must return strictly to white face 5
    emitDieStateChange();
    emitTick();
  }

  function toggleAutoCycle() {
    if (isAutoCycling) {
      stopAutoCycle();
      return false;
    } else {
      startAutoCycle();
      return true;
    }
  }

  function rotateNextConsole(fromAutoCycle = false) {
    activeConsoleIndex = (activeConsoleIndex + 1) % CONSOLES.length;
    applyActiveConsole();

    if (!fromAutoCycle) {
      // Manual scrolling strictly halts auto-cycle and restores white face 5
      if (isAutoCycling) stopAutoCycle();
      currentDieFace = 5;
      emitDieStateChange();
      emitTick();
    } else {
      // 60s Auto-cycling: advances to next scene, resets die back to 6, resets progress, and repeats cycle
      currentDieFace = 6;
      elapsedSeconds = 0;
      emitDieStateChange();
      emitTick();
    }
  }

  function rotatePrevConsole() {
    activeConsoleIndex = (activeConsoleIndex - 1 + CONSOLES.length) % CONSOLES.length;
    applyActiveConsole();
    if (isAutoCycling) stopAutoCycle();
    currentDieFace = 5;
    emitDieStateChange();
    emitTick();
  }

  function setConsoleById(id) {
    const idx = CONSOLES.findIndex(c => c.id === id);
    if (idx !== -1) {
      activeConsoleIndex = idx;
      applyActiveConsole();
      if (isAutoCycling) stopAutoCycle();
      currentDieFace = 5;
      emitDieStateChange();
      emitTick();
    }
  }

  function applyActiveConsole() {
    const current = CONSOLES[activeConsoleIndex];
    if (window.KineticConsole) {
      if (typeof window.KineticConsole.setMode === 'function') {
        window.KineticConsole.setMode(current.id);
      }
      if (typeof window.KineticConsole.show === 'function') {
        window.KineticConsole.show();
      }
    }
    emitConsoleChange(current);
  }

  // --- Telemetry & Weather Listeners ---
  function hookSensors() {
    if (typeof window === 'undefined') return;

    if (window.NomadTelemetryEngine && typeof window.NomadTelemetryEngine.onUpdate === 'function') {
      window.NomadTelemetryEngine.onUpdate((telemetry) => {
        if (!telemetry || !window.KineticConsole) return;
        const mph = (telemetry.speedMph !== null && !isNaN(telemetry.speedMph)) ? telemetry.speedMph : 0;
        const heading = (telemetry.headingRaw !== null && !isNaN(telemetry.headingRaw)) ? telemetry.headingRaw : 0;
        if (typeof window.KineticConsole.updateTelemetry === 'function') {
          window.KineticConsole.updateTelemetry({
            speedMph: mph,
            heading: heading,
            altitude: telemetry.elevationFeet || 0
          });
        }
      });
    }

    if (window.NomadWeatherEngine && typeof window.NomadWeatherEngine.onUpdate === 'function') {
      window.NomadWeatherEngine.onUpdate((weather) => {
        if (!weather || !window.KineticConsole) return;
        if (typeof window.KineticConsole.updateTelemetry === 'function') {
          window.KineticConsole.updateTelemetry({
            tempF: weather.temperatureF || 72,
            humidity: weather.humidityPercent || 45,
            uvIndex: weather.uvIndex || 2.5
          });
        }
      });
    }

    if (window.NomadLifecycleEngine && typeof window.NomadLifecycleEngine.onWakeResume === 'function') {
      window.NomadLifecycleEngine.onWakeResume(() => {
        if (window.KineticConsole && typeof window.KineticConsole.show === 'function') {
          window.KineticConsole.show();
        }
      });
    }
  }

  // --- Emitters ---
  function emitConsoleChange(consoleObj) {
    for (let i = 0; i < consoleSubscribers.length; i++) {
      try { consoleSubscribers[i](consoleObj); } catch (e) { console.error(e); }
    }
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('nomad-fidget-console', { detail: consoleObj }));
      } catch (e) {}
    }
  }

  function emitDieStateChange() {
    const data = {
      face: currentDieFace,
      isAutoCycling,
      elapsedSeconds,
      remainingSeconds: 60 - elapsedSeconds
    };
    for (let i = 0; i < dieSubscribers.length; i++) {
      try { dieSubscribers[i](data); } catch (e) { console.error(e); }
    }
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('nomad-fidget-die', { detail: data }));
      } catch (e) {}
    }
  }

  function emitTick() {
    const tickData = {
      elapsedSeconds,
      remainingSeconds: 60 - elapsedSeconds,
      percent: Math.min(100, Math.round((elapsedSeconds / 60) * 100)),
      face: currentDieFace,
      isAutoCycling
    };
    for (let i = 0; i < tickSubscribers.length; i++) {
      try { tickSubscribers[i](tickData); } catch (e) { console.error(e); }
    }
  }

  function init(targetContainer) {
    if (targetContainer) {
      containerElement = targetContainer;
      if (window.KineticConsole && typeof window.KineticConsole.init === 'function') {
        window.KineticConsole.init(containerElement);
        applyActiveConsole();
      }
    }
    hookSensors();
  }

  return {
    init,
    CONSOLES,
    getActiveConsole: () => CONSOLES[activeConsoleIndex],
    setConsole: setConsoleById,
    nextConsole: () => rotateNextConsole(false),
    prevConsole: rotatePrevConsole,
    advanceAutoCycle: () => rotateNextConsole(true),
    startAutoCycle,
    stopAutoCycle,
    toggleAutoCycle,
    triggerDieSnapSpin,
    getDieSvg,
    getDiePipsSvg,
    getState: () => ({
      console: CONSOLES[activeConsoleIndex],
      currentDieFace,
      isAutoCycling,
      elapsedSeconds,
      remainingSeconds: 60 - elapsedSeconds
    }),
    onConsoleChange: (cb) => {
      consoleSubscribers.push(cb);
      try { cb(CONSOLES[activeConsoleIndex]); } catch (e) {}
      return () => { const i = consoleSubscribers.indexOf(cb); if (i !== -1) consoleSubscribers.splice(i, 1); };
    },
    onDieStateChange: (cb) => {
      dieSubscribers.push(cb);
      try { cb({ face: currentDieFace, isAutoCycling, elapsedSeconds }); } catch (e) {}
      return () => { const i = dieSubscribers.indexOf(cb); if (i !== -1) dieSubscribers.splice(i, 1); };
    },
    onCountdownTick: (cb) => {
      tickSubscribers.push(cb);
      return () => { const i = tickSubscribers.indexOf(cb); if (i !== -1) tickSubscribers.splice(i, 1); };
    }
  };
}));
