/**
 * ====================================================================
 * NOMAD: SUITE — SCREEN WAKE LOCK & APP LIFECYCLE GUARD
 * Continuous In-Vehicle Screen Keep-Awake, Mobile Battery Policy Handler,
 * Foreground Recovery, Viewport Re-anchor & Animation Loop Guard
 * 
 * Visionary & Creator: BostonyFX
 * Architecture: Pure Decoupled Event-Driven Provider ("Sensory Core")
 * File: /nomad_suite/js/nomad-lifecycle-engine.js
 * ====================================================================
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NomadLifecycleEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // --- Internal State ---
  let isRunning = false;
  let sentinel = null; // WakeLockSentinel
  let isSupported = false;
  let isActive = false;
  let userWakeLockEnabled = true; // User intent: true = keep screen awake; false = user manually toggled off
  let lastAcquiredTime = null;
  let lastReleaseTime = null;
  let reacquireCount = 0;
  let failureReason = null;
  let watchdogIntervalId = null;

  // Registered callbacks
  const wakeResumeSubscribers = [];
  const visibilityChangeSubscribers = [];
  const stateChangeSubscribers = [];

  // Check API availability
  if (typeof navigator !== 'undefined' && 'wakeLock' in navigator && typeof navigator.wakeLock.request === 'function') {
    isSupported = true;
  }

  // --- Wake Lock Acquisition ---

  async function requestWakeLock(triggerSource = 'auto') {
    if (!isSupported) {
      failureReason = 'API_UNSUPPORTED';
      emitStateChange();
      return false;
    }

    // If user explicitly disabled keep-awake, do not auto-reacquire
    if (!userWakeLockEnabled && triggerSource !== 'user_enable' && triggerSource !== 'user_toggle') {
      return false;
    }

    // Do not attempt if page is hidden
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
      return false;
    }

    if (triggerSource === 'user_enable' || triggerSource === 'user_toggle') {
      userWakeLockEnabled = true;
    }

    // If already active and not released, skip redundant request
    if (sentinel !== null && !sentinel.released) {
      isActive = true;
      return true;
    }

    try {
      sentinel = await navigator.wakeLock.request('screen');
      isActive = true;
      userWakeLockEnabled = true;
      lastAcquiredTime = Date.now();
      reacquireCount++;
      failureReason = null;

      // Handle system release (e.g. user locks phone or switches app)
      sentinel.addEventListener('release', () => {
        isActive = false;
        lastReleaseTime = Date.now();
        sentinel = null;
        emitStateChange();
      });

      emitStateChange();
      return true;
    } catch (err) {
      isActive = false;
      failureReason = err.name || err.message || 'REQUEST_FAILED';
      emitStateChange();
      return false;
    }
  }

  async function releaseWakeLock(isManual = false) {
    if (isManual) {
      userWakeLockEnabled = false;
    }
    if (sentinel !== null && !sentinel.released) {
      try {
        await sentinel.release();
      } catch (e) {}
    }
    sentinel = null;
    isActive = false;
    lastReleaseTime = Date.now();
    emitStateChange();
  }

  async function toggleWakeLock() {
    if (isActive) {
      await releaseWakeLock(true);
      return false;
    } else {
      userWakeLockEnabled = true;
      const res = await requestWakeLock('user_toggle');
      return res;
    }
  }

  // --- Lifecycle & Foreground Recovery Engine ---

  function handleForegroundWakeResume(eventSource = 'visibilitychange') {
    const isVisible = (typeof document === 'undefined') || (document.visibilityState === 'visible');

    if (isVisible) {
      // 1. Instantly reacquire the screen wake lock
      requestWakeLock(`resume_${eventSource}`);

      // 2. Notify subscribers to re-anchor map viewports, sync tile canvases & resume loops
      for (let i = 0; i < wakeResumeSubscribers.length; i++) {
        try {
          wakeResumeSubscribers[i]({
            source: eventSource,
            timestamp: Date.now()
          });
        } catch (err) {
          console.error('NomadLifecycleEngine wakeResume callback error:', err);
        }
      }

      // 3. Dispatch global DOM event
      if (typeof window !== 'undefined') {
        try {
          window.dispatchEvent(new CustomEvent('nomad-wake-resume', {
            detail: { source: eventSource, timestamp: Date.now() }
          }));
        } catch (e) {}
      }
    }

    // Notify visibility subscribers
    for (let i = 0; i < visibilityChangeSubscribers.length; i++) {
      try {
        visibilityChangeSubscribers[i]({
          isVisible: isVisible,
          visibilityState: typeof document !== 'undefined' ? document.visibilityState : 'unknown',
          source: eventSource,
          timestamp: Date.now()
        });
      } catch (err) {
        console.error('NomadLifecycleEngine visibility callback error:', err);
      }
    }
  }

  // --- State Snapshot Builder ---

  function getLifecycleSnapshot() {
    return {
      isSupported: isSupported,
      isActive: isActive,
      userWakeLockEnabled: userWakeLockEnabled,
      visibilityState: typeof document !== 'undefined' ? document.visibilityState : 'unknown',
      isVisible: (typeof document === 'undefined') || (document.visibilityState === 'visible'),
      lastAcquiredTime: lastAcquiredTime,
      lastReleaseTime: lastReleaseTime,
      reacquireCount: reacquireCount,
      failureReason: failureReason,
      timestamp: Date.now()
    };
  }

  function emitStateChange() {
    const snapshot = getLifecycleSnapshot();

    for (let i = 0; i < stateChangeSubscribers.length; i++) {
      try {
        stateChangeSubscribers[i](snapshot);
      } catch (err) {
        console.error('NomadLifecycleEngine stateChange callback error:', err);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('nomad-lifecycle-state', { detail: snapshot }));
      } catch (e) {}
    }
  }

  // --- Start & Setup Lifecycle Listeners ---

  function start() {
    if (isRunning) return;
    isRunning = true;

    // 1. Initial immediate acquisition
    requestWakeLock('bootstrap');

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      // 2. Visibility change listener (tab switch, minimize, lock screen)
      document.addEventListener('visibilitychange', () => {
        handleForegroundWakeResume('visibilitychange');
      });

      // 3. Window focus listener (returning from native browser dialog or external app)
      window.addEventListener('focus', () => {
        handleForegroundWakeResume('focus');
      });

      // 4. Mobile pageshow (bfcache recovery when user swipes back from history)
      window.addEventListener('pageshow', (event) => {
        handleForegroundWakeResume(event.persisted ? 'bfcache_pageshow' : 'pageshow');
      });

      // 5. User interaction touch/click keeper (unlocks policy if initially blocked, only when user enabled)
      window.addEventListener('touchstart', () => {
        if (userWakeLockEnabled && !isActive) requestWakeLock('touchstart');
      }, { passive: true });

      window.addEventListener('click', (e) => {
        if (userWakeLockEnabled && !isActive) requestWakeLock('click');
      }, { passive: true });

      // 6. 15-second heartbeat watchdog
      if (watchdogIntervalId === null) {
        watchdogIntervalId = setInterval(() => {
          if (userWakeLockEnabled && document.visibilityState === 'visible' && (!isActive || sentinel === null || sentinel.released)) {
            requestWakeLock('watchdog_heartbeat');
          }
        }, 15000);
      }
    }

    emitStateChange();
  }

  function stop() {
    if (!isRunning) return;
    isRunning = false;

    if (watchdogIntervalId !== null) {
      clearInterval(watchdogIntervalId);
      watchdogIntervalId = null;
    }

    releaseWakeLock(true);
  }

  // --- Subscription API ---

  function onWakeResume(callback) {
    if (typeof callback !== 'function') return () => {};
    wakeResumeSubscribers.push(callback);
    return function unsubscribe() {
      const idx = wakeResumeSubscribers.indexOf(callback);
      if (idx !== -1) wakeResumeSubscribers.splice(idx, 1);
    };
  }

  function onVisibilityChange(callback) {
    if (typeof callback !== 'function') return () => {};
    visibilityChangeSubscribers.push(callback);
    return function unsubscribe() {
      const idx = visibilityChangeSubscribers.indexOf(callback);
      if (idx !== -1) visibilityChangeSubscribers.splice(idx, 1);
    };
  }

  function onStateChange(callback) {
    if (typeof callback !== 'function') return () => {};
    stateChangeSubscribers.push(callback);
    try { callback(getLifecycleSnapshot()); } catch (e) {}
    return function unsubscribe() {
      const idx = stateChangeSubscribers.indexOf(callback);
      if (idx !== -1) stateChangeSubscribers.splice(idx, 1);
    };
  }

  // Auto-init on script load in browser
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      start();
    }, 60);
  }

  return {
    start,
    stop,
    requestWakeLock,
    releaseWakeLock,
    toggleWakeLock,
    isWakeLockActive: () => isActive,
    isUserEnabled: () => userWakeLockEnabled,
    isSupported: () => isSupported,
    getState: getLifecycleSnapshot,
    onWakeResume,
    onVisibilityChange,
    onStateChange,
    subscribe: onStateChange
  };
}));
