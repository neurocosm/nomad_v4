/**
 * ====================================================================
 * NOMAD: SUITE — COMPASS, ELEVATION & KINEMATICS ENGINE
 * 16-Point Cardinal Resolver, Sensor Fusion (Gyro/Compass + GPS Track),
 * Rolling Altitude Smoother, Vertical Climb Rate (VSI) & Signal Fidelity
 * 
 * Visionary & Creator: BostonyFX
 * Architecture: Pure Decoupled Event-Driven Provider ("Sensory Core")
 * File: /nomad_suite/js/nomad-kinematics-engine.js
 * ====================================================================
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NomadKinematicsEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // --- 16-Point Compass Reference Arrays ---
  const CARDINAL_16_SHORT = [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW',
    'W', 'WNW', 'NW', 'NNW'
  ];

  const CARDINAL_16_WORDS = [
    'NORTH', 'NORTH-NORTHEAST', 'NORTHEAST', 'EAST-NORTHEAST',
    'EAST', 'EAST-SOUTHEAST', 'SOUTHEAST', 'SOUTH-SOUTHEAST',
    'SOUTH', 'SOUTH-SOUTHWEST', 'SOUTHWEST', 'WEST-SOUTHWEST',
    'WEST', 'WEST-NORTHWEST', 'NORTHWEST', 'NORTH-NORTHWEST'
  ];

  const CARDINAL_8_SHORT = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const CARDINAL_8_WORDS = ['NORTH', 'NORTHEAST', 'EAST', 'SOUTHEAST', 'SOUTH', 'SOUTHWEST', 'WEST', 'NORTHWEST'];

  // --- Internal State ---
  let isListening = false;
  let orientationPermissionState = 'unknown'; // 'unknown', 'granted', 'denied', 'unsupported'

  // Heading & Fusion
  let currentFusedHeading = 0;
  let rawGpsHeading = null;
  let rawGyroHeading = null;
  let headingSource = 'default'; // 'gps', 'gyro', 'default'
  let currentSpeedMph = 0;

  // Elevation & Climb Rate (VSI)
  let rawAltitudeMeters = null;
  let fallbackElevationMeters = null;
  let altitudeHistory = []; // [{ altMeters, time }]
  const ALT_HISTORY_WINDOW_MS = 5000; // 5-second rolling window for VSI calculation
  const ALT_HISTORY_MAX_POINTS = 20;

  let verticalSpeedFpm = 0;     // Feet per minute
  let verticalSpeedMps = 0;     // Meters per second
  let climbStatus = 'LEVEL';    // 'LEVEL', 'CLIMBING', 'DESCENDING'

  // GPS Signal Quality & Accuracy
  let rawAccuracyMeters = null;
  let signalQualityTier = 'UNKNOWN'; // 'RTK', 'EXCELLENT', 'GOOD', 'MODERATE', 'DEGRADED', 'ESTIMATE'
  let signalQualityColor = '#64748b';

  // Telemetry Squircle Display Mode (RoadTrip & HUD standard)
  // 0: HEADING & CARDINAL, 1: ALTITUDE, 2: CLIMB RATE, 3: GPS ACCURACY
  let telemetryMode = 0;
  try {
    const saved = localStorage.getItem('nomad_telemetry_mode');
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 3) {
        telemetryMode = parsed;
      }
    }
  } catch (e) {}

  // Subscribers
  const subscribers = [];

  // --- Compass Resolver Helpers ---

  function normalizeDegrees(deg) {
    if (deg === null || isNaN(deg)) return 0;
    return ((deg % 360) + 360) % 360;
  }

  function get16PointCardinal(angle) {
    const norm = normalizeDegrees(angle);
    // 360 / 16 = 22.5 degrees per sector
    const index = Math.round(norm / 22.5) % 16;
    return {
      short: CARDINAL_16_SHORT[index],
      word: CARDINAL_16_WORDS[index],
      sectorIndex: index,
      degrees: norm
    };
  }

  function get8PointCardinal(angle) {
    const norm = normalizeDegrees(angle);
    const index = Math.round(norm / 45) % 8;
    return {
      short: CARDINAL_8_SHORT[index],
      word: CARDINAL_8_WORDS[index],
      sectorIndex: index,
      degrees: norm
    };
  }

  function getAdaptiveCardinalLabel(heading) {
    const card16 = get16PointCardinal(heading);
    const text = card16.word;
    const isShort = (text === 'NORTH' || text === 'SOUTH' || text === 'EAST' || text === 'WEST');
    return {
      text: text,
      shortText: card16.short,
      isShort: isShort,
      headingDeg: Math.round(card16.degrees)
    };
  }

  // --- Vertical Speed Indicator (VSI) & Altimeter Smoother ---

  function updateAltitudeKinematics(altitudeMeters) {
    const now = Date.now();
    if (altitudeMeters === null || isNaN(altitudeMeters)) {
      return;
    }

    rawAltitudeMeters = altitudeMeters;

    // Prune history older than rolling window
    altitudeHistory = altitudeHistory.filter(pt => (now - pt.time) <= ALT_HISTORY_WINDOW_MS);

    // Append current reading
    altitudeHistory.push({ altMeters: altitudeMeters, time: now });
    if (altitudeHistory.length > ALT_HISTORY_MAX_POINTS) {
      altitudeHistory.shift();
    }

    // Need at least 2 points separated by >= 1000ms for stable climb rate
    if (altitudeHistory.length >= 2) {
      const oldest = altitudeHistory[0];
      const newest = altitudeHistory[altitudeHistory.length - 1];
      const deltaSec = (newest.time - oldest.time) / 1000;

      if (deltaSec >= 1.0) {
        // Linear regression slope over history window
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        const n = altitudeHistory.length;
        const t0 = oldest.time;

        for (let i = 0; i < n; i++) {
          const t = (altitudeHistory[i].time - t0) / 1000;
          const y = altitudeHistory[i].altMeters;
          sumX += t;
          sumY += y;
          sumXY += t * y;
          sumXX += t * t;
        }

        const denominator = (n * sumXX - sumX * sumX);
        let slopeMps = 0;
        if (Math.abs(denominator) > 1e-5) {
          slopeMps = (n * sumXY - sumX * sumY) / denominator;
        } else {
          slopeMps = (newest.altMeters - oldest.altMeters) / deltaSec;
        }

        const slopeFpm = slopeMps * 3.28084 * 60; // m/s -> ft/min

        // Deadband filter: GPS vertical accuracy is naturally noisy (+/- 15m).
        // Vertical speeds within +/- 55 ft/min are considered level cruising.
        if (Math.abs(slopeFpm) < 55) {
          verticalSpeedFpm = 0;
          verticalSpeedMps = 0;
          climbStatus = 'LEVEL';
        } else if (slopeFpm >= 55) {
          verticalSpeedFpm = Math.round(slopeFpm);
          verticalSpeedMps = Math.round(slopeMps * 10) / 10;
          climbStatus = 'CLIMBING';
        } else {
          verticalSpeedFpm = Math.round(slopeFpm);
          verticalSpeedMps = Math.round(slopeMps * 10) / 10;
          climbStatus = 'DESCENDING';
        }
      }
    } else {
      verticalSpeedFpm = 0;
      verticalSpeedMps = 0;
      climbStatus = 'LEVEL';
    }
  }

  // --- GPS Signal Quality Resolver ---

  function updateSignalQuality(accuracyMeters, hasSatelliteLock) {
    rawAccuracyMeters = (accuracyMeters !== null && !isNaN(accuracyMeters)) ? accuracyMeters : null;

    if (!hasSatelliteLock || rawAccuracyMeters === null) {
      signalQualityTier = 'ESTIMATE';
      signalQualityColor = '#bf5af2'; // Purple
      return;
    }

    if (rawAccuracyMeters <= 3.5) {
      signalQualityTier = 'PINPOINT / RTK';
      signalQualityColor = '#00f3ff'; // Neon Cyan
    } else if (rawAccuracyMeters <= 8) {
      signalQualityTier = 'EXCELLENT';
      signalQualityColor = '#30d158'; // Emerald Green
    } else if (rawAccuracyMeters <= 20) {
      signalQualityTier = 'GOOD';
      signalQualityColor = '#ffb703'; // Amber Yellow
    } else if (rawAccuracyMeters <= 40) {
      signalQualityTier = 'MODERATE';
      signalQualityColor = '#fb8500'; // Orange
    } else {
      signalQualityTier = 'DEGRADED';
      signalQualityColor = '#ff3b30'; // Red
    }
  }

  // --- Sensor Fusion: Hardware Gyroscope & Magnetometer ---

  function handleDeviceOrientation(event) {
    if (!event) return;

    let compassDeg = null;

    // 1. iOS Safari webkitCompassHeading (0-360 deg, clockwise from magnetic North)
    if (typeof event.webkitCompassHeading !== 'undefined' && event.webkitCompassHeading !== null) {
      compassDeg = event.webkitCompassHeading;
    } else if (event.alpha !== null && typeof event.alpha !== 'undefined') {
      // 2. Android Chrome deviceorientation: alpha is counter-clockwise [0..360]
      // Invert to clockwise: 360 - alpha
      let heading = 360 - event.alpha;

      // Compensate for screen rotation if available
      const screenAngle = (typeof window.orientation === 'number')
        ? window.orientation
        : (window.screen && window.screen.orientation && window.screen.orientation.angle) || 0;

      heading = (heading + screenAngle) % 360;
      compassDeg = heading;
    }

    if (compassDeg !== null && !isNaN(compassDeg)) {
      rawGyroHeading = normalizeDegrees(compassDeg);

      // SENSOR FUSION LAW:
      // When driving (> 3.2 MPH), GPS velocity vector takes absolute priority over device tilt
      // (avoids phone-in-cradle orientation angle skewing the vehicle course).
      // When stationary or walking (< 3.2 MPH), hardware compass smoothly guides heading.
      if (currentSpeedMph <= 3.2) {
        currentFusedHeading = rawGyroHeading;
        headingSource = 'gyro';
        emitUpdate();
      }
    }
  }

  function startOrientationListening() {
    if (isListening || typeof window === 'undefined') return;

    // Check iOS 13+ permission model
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      orientationPermissionState = 'prompt-needed';
    } else if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleDeviceOrientation, true);
      isListening = true;
      orientationPermissionState = 'granted';
    } else {
      orientationPermissionState = 'unsupported';
    }
  }

  function stopOrientationListening() {
    if (!isListening || typeof window === 'undefined') return;
    window.removeEventListener('deviceorientation', handleDeviceOrientation, true);
    isListening = false;
  }

  async function requestOrientationPermission() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const state = await DeviceOrientationEvent.requestPermission();
        orientationPermissionState = state;
        if (state === 'granted') {
          window.addEventListener('deviceorientation', handleDeviceOrientation, true);
          isListening = true;
          return true;
        }
        return false;
      } catch (err) {
        console.warn('Orientation permission error:', err);
        orientationPermissionState = 'denied';
        return false;
      }
    }
    return true;
  }

  // --- Snapshot Builder ---

  function buildKinematicsSnapshot() {
    const card16 = get16PointCardinal(currentFusedHeading);
    const card8 = get8PointCardinal(currentFusedHeading);
    const adaptiveLabel = getAdaptiveCardinalLabel(currentFusedHeading);

    // Active elevation: GPS altitude takes priority; fall back to digital elevation model
    const activeAltMeters = rawAltitudeMeters !== null ? rawAltitudeMeters : fallbackElevationMeters;
    const activeAltFeet = activeAltMeters !== null ? Math.round(activeAltMeters * 3.28084) : null;

    const accFeet = rawAccuracyMeters !== null ? Math.round(rawAccuracyMeters * 3.28084) : null;

    return {
      // Heading & 16-Point Compass
      headingDeg: Math.round(currentFusedHeading),
      headingRaw: currentFusedHeading,
      headingSource: headingSource,
      cardinal16Short: card16.short,
      cardinal16Word: card16.word,
      cardinal8Short: card8.short,
      cardinal8Word: card8.word,
      adaptiveCardinalText: adaptiveLabel.text,
      adaptiveCardinalShort: adaptiveLabel.isShort,

      // Altimeter & Vertical Climb Rate (VSI)
      altitudeMeters: activeAltMeters !== null ? Math.round(activeAltMeters) : null,
      altitudeFeet: activeAltFeet,
      hasAltitude: activeAltMeters !== null,
      altitudeSource: rawAltitudeMeters !== null ? 'gps' : (fallbackElevationMeters !== null ? 'digital_model' : 'none'),
      verticalSpeedFpm: verticalSpeedFpm,
      verticalSpeedMps: verticalSpeedMps,
      climbStatus: climbStatus, // 'LEVEL', 'CLIMBING', 'DESCENDING'

      // GPS Signal Quality & Accuracy
      accuracyMeters: rawAccuracyMeters !== null ? Math.round(rawAccuracyMeters) : null,
      accuracyFeet: accFeet,
      signalQualityTier: signalQualityTier,
      signalQualityColor: signalQualityColor,

      // Telemetry Squircle Mode
      telemetryMode: telemetryMode, // 0: HEADING, 1: ALTITUDE, 2: CLIMB RATE, 3: GPS ACCURACY
      telemetryModeName: ['HEADING', 'ALTITUDE', 'CLIMB RATE', 'GPS ACCURACY'][telemetryMode],

      timestamp: Date.now()
    };
  }

  function emitUpdate() {
    const snapshot = buildKinematicsSnapshot();

    for (let i = 0; i < subscribers.length; i++) {
      try {
        subscribers[i](snapshot);
      } catch (err) {
        console.error('NomadKinematicsEngine subscriber error:', err);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('nomad-kinematics', { detail: snapshot }));
      } catch (e) {}
    }
  }

  // --- Telemetry Hook (Automatic Feed from NomadTelemetryEngine & NomadWeatherEngine) ---

  function hookSensoryEngines() {
    if (typeof window === 'undefined') return;

    // 1. Listen to Telemetry Engine
    if (window.NomadTelemetryEngine && typeof window.NomadTelemetryEngine.onUpdate === 'function') {
      window.NomadTelemetryEngine.onUpdate((telemetry) => {
        if (!telemetry) return;

        currentSpeedMph = telemetry.speedMph || 0;

        // GPS Heading takes priority when moving > 3.2 MPH
        if (telemetry.hasValidHeading && telemetry.headingRaw !== null && !isNaN(telemetry.headingRaw)) {
          rawGpsHeading = normalizeDegrees(telemetry.headingRaw);
          if (currentSpeedMph > 3.2 || headingSource !== 'gyro') {
            currentFusedHeading = rawGpsHeading;
            headingSource = 'gps';
          }
        }

        // Altitude & VSI update
        if (telemetry.altitudeMeters !== null && telemetry.altitudeMeters !== undefined) {
          updateAltitudeKinematics(telemetry.altitudeMeters);
        }

        // Accuracy & Signal Quality
        updateSignalQuality(telemetry.accuracyMeters, telemetry.hasRealGpsLock);

        emitUpdate();
      });
    }

    // 2. Listen to Weather Engine (for terrain elevation fallback)
    if (window.NomadWeatherEngine && typeof window.NomadWeatherEngine.onUpdate === 'function') {
      window.NomadWeatherEngine.onUpdate((weather) => {
        if (weather && weather.elevationMeters !== null && !isNaN(weather.elevationMeters)) {
          fallbackElevationMeters = weather.elevationMeters;
          if (rawAltitudeMeters === null) {
            emitUpdate();
          }
        }
      });
    }
  }

  // --- Telemetry Mode Controller ---

  function cycleTelemetryMode() {
    telemetryMode = (telemetryMode + 1) % 4;
    try {
      localStorage.setItem('nomad_telemetry_mode', telemetryMode);
    } catch (e) {}

    // Gentle tactile haptic tick if supported
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try { navigator.vibrate(15); } catch (e) {}
    }

    emitUpdate();
    return telemetryMode;
  }

  function setTelemetryMode(modeIndex) {
    if (typeof modeIndex === 'number' && modeIndex >= 0 && modeIndex <= 3) {
      telemetryMode = modeIndex;
      try {
        localStorage.setItem('nomad_telemetry_mode', telemetryMode);
      } catch (e) {}
      emitUpdate();
    }
    return telemetryMode;
  }

  // --- Public API ---

  function start() {
    startOrientationListening();
    hookSensoryEngines();
    emitUpdate();
  }

  function stop() {
    stopOrientationListening();
  }

  function onUpdate(callback) {
    if (typeof callback !== 'function') return () => {};
    subscribers.push(callback);
    try {
      callback(buildKinematicsSnapshot());
    } catch (e) {}
    return function unsubscribe() {
      const idx = subscribers.indexOf(callback);
      if (idx !== -1) subscribers.splice(idx, 1);
    };
  }

  // Auto-init on script load
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      start();
    }, 50);
  }

  return {
    start,
    stop,
    onUpdate,
    subscribe: onUpdate,
    getState: buildKinematicsSnapshot,
    get16PointCardinal,
    get8PointCardinal,
    getAdaptiveCardinalLabel,
    cycleTelemetryMode,
    setTelemetryMode,
    requestOrientationPermission,
    CARDINAL_16_SHORT,
    CARDINAL_16_WORDS
  };
}));
