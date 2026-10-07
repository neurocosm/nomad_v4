/**
 * ====================================================================
 * NOMAD: SUITE — TRIP COMPUTER & GPX 1.1 FLIGHT RECORDER ENGINE
 * Standardized Telemetry Logging, Odometer, Drive Time & GIS Exporter
 * 
 * Capabilities:
 * 1. Live Trip Odometer: Accurate Haversine distance tracking (Miles & KM)
 * 2. Speed Analytics: Real-time, Average (moving/total), and Peak Top Speed
 * 3. Drive Time Counter: Active Drive Time vs Stationary Idle Time (1.8 MPH Deadband)
 * 4. High-Fidelity GPX 1.1 XML Flight Recorder:
 *    - <trkpt lat="..." lon="..."> with <ele>, <time>, <speed> (m/s), <course>
 *    - Compatible with Strava, Google Earth, Garmin BaseCamp & QGIS
 * 5. One-Click Instant File Export (.gpx) with formatted timestamped filenames
 * 6. LocalStorage Recovery: Preserves active trip odometer across page refreshes
 * 
 * Visionary & Creator: BostonyFX (@tony_bostony)
 * Architecture: Pure Decoupled Event-Driven Provider ("Sensory Core")
 * File: /nomad_suite/js/nomad-trip-engine.js
 * ====================================================================
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NomadTripEngine = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : this), function () {
  'use strict';

  // --- Constants ---
  const STORAGE_KEY = 'nomad_trip_recorder_v4';
  const STATIONARY_SPEED_THRESHOLD_MPH = 1.8; // Hardware stationary deadband
  const METERS_TO_MILES = 0.000621371;
  const METERS_TO_FEET = 3.28084;
  const MPH_TO_MPS = 0.44704;

  // --- Internal State ---
  let isRecording = true; // Auto-starts recording by default on road trip
  let isPaused = false;
  let startTime = Date.now();
  let lastTickTime = Date.now();
  
  let elapsedMs = 0;
  let movingMs = 0;
  let idleMs = 0;
  
  let distanceMeters = 0;
  let currentSpeedMph = 0;
  let maxSpeedMph = 0;
  
  let lastFix = null; // { lat, lon, altMeters, speedMph, heading, roadName, time }
  let trackpoints = []; // [{ lat, lon, ele, time, speedMps, course, name }]
  
  let timerInterval = null;
  const subscribers = [];

  // --- Distance Helper (Haversine formula in meters) ---
  function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
    if (lat1 === lat2 && lon1 === lon2) return 0;
    const R = 6371000; // Earth radius in meters
    const toRad = (deg) => (deg * Math.PI) / 180;
    
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // --- Format Duration Helper (HH:MM:SS) ---
  function formatDuration(ms) {
    const totalSec = Math.floor(ms / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    
    const pad = (n) => String(n).padStart(2, '0');
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  }

  // --- Restore State from Storage ---
  function loadPersistedState() {
    if (typeof localStorage === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data && typeof data === 'object') {
          elapsedMs = data.elapsedMs || 0;
          movingMs = data.movingMs || 0;
          idleMs = data.idleMs || 0;
          distanceMeters = data.distanceMeters || 0;
          maxSpeedMph = data.maxSpeedMph || 0;
          isRecording = data.isRecording !== undefined ? data.isRecording : true;
          isPaused = data.isPaused || false;
          if (Array.isArray(data.trackpoints)) {
            // Cap stored trackpoints to prevent exceeding localStorage quota
            trackpoints = data.trackpoints.slice(-1200);
          }
        }
      }
    } catch (e) {
      console.warn('NomadTripEngine: could not load persisted state', e);
    }
  }

  // --- Persist State ---
  function saveState() {
    if (typeof localStorage === 'undefined') return;
    try {
      const stateToSave = {
        elapsedMs,
        movingMs,
        idleMs,
        distanceMeters,
        maxSpeedMph,
        isRecording,
        isPaused,
        trackpoints: trackpoints.slice(-800) // Keep recent 800 fixes in localStorage
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (_) {}
  }

  // --- Get State Summary Object ---
  function getState() {
    const distanceMiles = distanceMeters * METERS_TO_MILES;
    const distanceKm = distanceMeters / 1000;
    
    // Average Moving Speed (miles / hours)
    const movingHours = (movingMs / 1000) / 3600;
    const avgMovingSpeedMph = movingHours > 0 ? (distanceMiles / movingHours) : 0;
    
    // Total Elapsed Average Speed
    const totalHours = (elapsedMs / 1000) / 3600;
    const avgTotalSpeedMph = totalHours > 0 ? (distanceMiles / totalHours) : 0;

    const isStationary = currentSpeedMph <= STATIONARY_SPEED_THRESHOLD_MPH;
    const movingPercent = elapsedMs > 0 ? Math.round((movingMs / elapsedMs) * 100) : 0;

    return {
      isRecording,
      isPaused,
      isStationary,
      movingPercent,
      elapsedMs,
      movingMs,
      idleMs,
      elapsedFormatted: formatDuration(elapsedMs),
      movingFormatted: formatDuration(movingMs),
      idleFormatted: formatDuration(idleMs),
      distanceMeters: Math.round(distanceMeters),
      distanceMiles: parseFloat(distanceMiles.toFixed(2)),
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      currentSpeedMph: Math.round(currentSpeedMph),
      avgMovingSpeedMph: parseFloat(avgMovingSpeedMph.toFixed(1)),
      avgTotalSpeedMph: parseFloat(avgTotalSpeedMph.toFixed(1)),
      maxSpeedMph: Math.round(maxSpeedMph),
      trackpointCount: trackpoints.length,
      lastFix
    };
  }

  // --- Dispatch Updates ---
  function notifySubscribers() {
    const data = getState();
    for (let i = 0; i < subscribers.length; i++) {
      try {
        subscribers[i](data);
      } catch (err) {
        console.error('NomadTripEngine subscriber error:', err);
      }
    }
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('nomad-trip-update', { detail: data }));
      } catch (_) {}
    }
  }

  // --- Clock Watchdog (Ticks every second) ---
  function startClock() {
    if (timerInterval) clearInterval(timerInterval);
    lastTickTime = Date.now();

    timerInterval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickTime;
      lastTickTime = now;

      if (isRecording && !isPaused) {
        elapsedMs += delta;
        if (currentSpeedMph > STATIONARY_SPEED_THRESHOLD_MPH) {
          movingMs += delta;
        } else {
          idleMs += delta;
        }
        notifySubscribers();
        
        // Auto-save state every 15 seconds
        if (Math.floor(elapsedMs / 1000) % 15 === 0) {
          saveState();
        }
      }
    }, 1000);
  }

  // --- Ingest Live GPS Telemetry Fix ---
  function addFix(telemetry) {
    if (!telemetry || !isRecording || isPaused) return;

    const lat = typeof telemetry.latitude === 'number' ? telemetry.latitude : (telemetry.coords ? telemetry.coords.latitude : null);
    const lon = typeof telemetry.longitude === 'number' ? telemetry.longitude : (telemetry.coords ? telemetry.coords.longitude : null);
    if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) return;

    const mph = (telemetry.speedMph !== null && !isNaN(telemetry.speedMph)) ? Math.max(0, telemetry.speedMph) : 0;
    currentSpeedMph = mph;

    if (mph > maxSpeedMph) {
      maxSpeedMph = mph;
    }

    const altMeters = (typeof telemetry.altitudeMeters === 'number' && !isNaN(telemetry.altitudeMeters))
      ? telemetry.altitudeMeters
      : (telemetry.elevationFeet ? telemetry.elevationFeet / METERS_TO_FEET : 0);

    const heading = (telemetry.headingRaw !== null && !isNaN(telemetry.headingRaw))
      ? telemetry.headingRaw
      : (telemetry.heading || 0);

    const roadName = telemetry.streetName || telemetry.roadName || '';
    const nowISO = new Date().toISOString();

    // Distance Accumulation & Jitter Suppression
    if (lastFix) {
      const dist = calculateDistanceMeters(lastFix.lat, lastFix.lon, lat, lon);
      const timeDeltaSec = Math.max(0.1, (Date.now() - new Date(lastFix.time).getTime()) / 1000);
      const impliedSpeedMps = dist / timeDeltaSec;

      // Filter stationary multipath jitter (< 2.5m while vehicle is stationary or stopped at red light)
      // and reject impossible satellite teleport jumps (> 250 MPH = ~112 m/s over short intervals)
      const isTeleportJump = (timeDeltaSec < 10 && impliedSpeedMps > 112);
      const isStationaryJitter = (mph < STATIONARY_SPEED_THRESHOLD_MPH && dist < 2.5);

      if (!isTeleportJump && !isStationaryJitter) {
        distanceMeters += dist;
      }
    }

    const currentFix = {
      lat: parseFloat(lat.toFixed(6)),
      lon: parseFloat(lon.toFixed(6)),
      altMeters: parseFloat(altMeters.toFixed(1)),
      speedMph: parseFloat(mph.toFixed(1)),
      heading: Math.round(heading),
      roadName,
      time: nowISO
    };

    lastFix = currentFix;

    // Log GPX Trackpoint (Sample rate: log points if moving or at least once every 10s)
    const shouldLogPoint =
      trackpoints.length === 0 ||
      mph > STATIONARY_SPEED_THRESHOLD_MPH ||
      (Date.now() - new Date(trackpoints[trackpoints.length - 1].time).getTime() >= 10000);

    if (shouldLogPoint) {
      trackpoints.push({
        lat: currentFix.lat,
        lon: currentFix.lon,
        ele: currentFix.altMeters,
        time: nowISO,
        speedMps: parseFloat((mph * MPH_TO_MPS).toFixed(2)),
        course: currentFix.heading,
        name: roadName
      });
    }

    notifySubscribers();
  }

  // --- GPX 1.1 XML Generator ---
  function generateGPXString() {
    const state = getState();
    const now = new Date();
    const nowISO = now.toISOString();

    let gpx = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    gpx += `<gpx version="1.1" creator="NOMAD Hyperspace HUD by BostonyFX" \n`;
    gpx += `  xmlns="http://www.topografix.com/GPX/1/1" \n`;
    gpx += `  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" \n`;
    gpx += `  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">\n`;
    
    // Metadata Header
    const creator = window.NOMAD_CREATOR || {
      name: "BostonyFX",
      handle: "@tony_bostony",
      url: "https://www.instagram.com/tony_bostony/"
    };
    gpx += `  <metadata>\n`;
    gpx += `    <name>NOMAD Flight Log - ${now.toLocaleDateString()}</name>\n`;
    gpx += `    <desc>Vehicular road trip telemetry recorded with NOMAD HUD. Total Distance: ${state.distanceMiles} mi, Max Speed: ${state.maxSpeedMph} mph, Avg Speed: ${state.avgMovingSpeedMph} mph.</desc>\n`;
    gpx += `    <author>\n`;
    gpx += `      <name>${creator.name} (${creator.handle})</name>\n`;
    gpx += `      <link href="${creator.url}">\n`;
    gpx += `        <text>${creator.name} Instagram</text>\n`;
    gpx += `      </link>\n`;
    gpx += `    </author>\n`;
    gpx += `    <time>${nowISO}</time>\n`;
    gpx += `  </metadata>\n`;

    // Track Segment
    gpx += `  <trk>\n`;
    gpx += `    <name>NOMAD Track ${now.toLocaleDateString()}</name>\n`;
    gpx += `    <type>Driving</type>\n`;
    gpx += `    <trkseg>\n`;

    trackpoints.forEach((pt) => {
      gpx += `      <trkpt lat="${pt.lat}" lon="${pt.lon}">\n`;
      if (pt.ele !== undefined && !isNaN(pt.ele)) {
        gpx += `        <ele>${pt.ele}</ele>\n`;
      }
      gpx += `        <time>${pt.time}</time>\n`;
      if (pt.course !== undefined && !isNaN(pt.course)) {
        gpx += `        <course>${pt.course}</course>\n`;
      }
      if (pt.speedMps !== undefined && !isNaN(pt.speedMps)) {
        gpx += `        <speed>${pt.speedMps}</speed>\n`;
      }
      if (pt.name) {
        const cleanName = String(pt.name).replace(/[<>&'"]/g, '');
        gpx += `        <name>${cleanName}</name>\n`;
      }
      gpx += `      </trkpt>\n`;
    });

    gpx += `    </trkseg>\n`;
    gpx += `  </trk>\n`;
    gpx += `</gpx>\n`;

    return gpx;
  }

  // --- Download GPX File ---
  function exportGPX(customFilename) {
    if (typeof document === 'undefined') {
      return { success: false, reason: 'No DOM document available (headless environment)' };
    }

    if (trackpoints.length === 0) {
      if (lastFix) {
        trackpoints.push({
          lat: lastFix.lat,
          lon: lastFix.lon,
          ele: lastFix.altMeters,
          time: lastFix.time || new Date().toISOString(),
          speedMps: parseFloat((lastFix.speedMph * MPH_TO_MPS).toFixed(2)),
          course: lastFix.heading,
          name: lastFix.roadName
        });
      } else if (typeof window !== 'undefined' && window.NomadTelemetryEngine && typeof window.NomadTelemetryEngine.getSnapshot === 'function') {
        const snap = window.NomadTelemetryEngine.getSnapshot();
        if (snap && (snap.latitude || (snap.coords && snap.coords.latitude))) {
          addFix(snap);
        }
      }
    }

    if (trackpoints.length === 0) {
      return { success: false, reason: 'No trackpoints recorded yet. Acquire GPS fix or simulate a drive step first.' };
    }

    const gpxContent = generateGPXString();
    const blob = new Blob([gpxContent], { type: 'application/gpx+xml;charset=utf-8' });
    
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timestampTag = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const filename = customFilename || `NOMAD-TRIP-${timestampTag}.gpx`;

    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = filename;
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);
    downloadLink.click();

    setTimeout(() => {
      if (downloadLink.parentNode) {
        downloadLink.parentNode.removeChild(downloadLink);
      }
      URL.revokeObjectURL(downloadLink.href);
    }, 1500);

    return {
      success: true,
      filename,
      trackpointCount: trackpoints.length,
      bytes: gpxContent.length
    };
  }

  // --- Simulate Driving Step (For Testing & Indoor Benchmarking) ---
  function simulateDriveStep(milesDelta = 0.1, speedMph = 55.0, roadName = 'I-95 South') {
    isRecording = true;
    isPaused = false;
    currentSpeedMph = Math.max(0, speedMph);
    if (currentSpeedMph > maxSpeedMph) {
      maxSpeedMph = currentSpeedMph;
    }

    const metersDelta = milesDelta / METERS_TO_MILES;
    distanceMeters += metersDelta;

    const impliedSec = Math.max(1, Math.round((milesDelta / Math.max(1, speedMph)) * 3600));
    elapsedMs += impliedSec * 1000;
    if (speedMph > STATIONARY_SPEED_THRESHOLD_MPH) {
      movingMs += impliedSec * 1000;
    } else {
      idleMs += impliedSec * 1000;
    }

    // Step latitude southwards (~0.0014 deg per 0.1 mi)
    const baseLat = lastFix ? lastFix.lat : 42.4500;
    const baseLon = lastFix ? lastFix.lon : -71.2200;
    const baseAlt = lastFix ? lastFix.altMeters : 45.0;
    const heading = 180;

    const newLat = parseFloat((baseLat - (milesDelta * 0.0145)).toFixed(6));
    const newLon = parseFloat(baseLon.toFixed(6));
    const newAlt = parseFloat((baseAlt + (Math.random() * 2 - 1)).toFixed(1));
    const nowISO = new Date().toISOString();

    lastFix = {
      lat: newLat,
      lon: newLon,
      altMeters: newAlt,
      speedMph: parseFloat(speedMph.toFixed(1)),
      heading,
      roadName,
      time: nowISO
    };

    trackpoints.push({
      lat: newLat,
      lon: newLon,
      ele: newAlt,
      time: nowISO,
      speedMps: parseFloat((speedMph * MPH_TO_MPS).toFixed(2)),
      course: heading,
      name: roadName
    });

    saveState();
    notifySubscribers();
    return getState();
  }

  // --- Controls ---
  function startTrip() {
    isRecording = true;
    isPaused = false;
    lastTickTime = Date.now();
    saveState();
    notifySubscribers();
  }

  function pauseTrip() {
    isPaused = true;
    saveState();
    notifySubscribers();
  }

  function resumeTrip() {
    isPaused = false;
    lastTickTime = Date.now();
    saveState();
    notifySubscribers();
  }

  function togglePauseTrip() {
    if (isPaused) {
      resumeTrip();
      return false; // isPaused = false
    } else {
      pauseTrip();
      return true; // isPaused = true
    }
  }

  function resetTrip() {
    elapsedMs = 0;
    movingMs = 0;
    idleMs = 0;
    distanceMeters = 0;
    maxSpeedMph = 0;
    currentSpeedMph = 0;
    lastFix = null;
    trackpoints = [];
    isPaused = false;
    isRecording = true;
    lastTickTime = Date.now();

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (_) {}
    }

    notifySubscribers();
  }

  // --- Hook Live Telemetry Engine ---
  function hookSensors() {
    if (typeof window === 'undefined') return;

    if (window.NomadTelemetryEngine && typeof window.NomadTelemetryEngine.onUpdate === 'function') {
      window.NomadTelemetryEngine.onUpdate((telemetry) => {
        addFix(telemetry);
      });
    }

    window.addEventListener('nomad-telemetry', (e) => {
      if (e && e.detail) {
        addFix(e.detail);
      }
    });

    if (window.NomadLifecycleEngine && typeof window.NomadLifecycleEngine.onWakeResume === 'function') {
      window.NomadLifecycleEngine.onWakeResume(() => {
        lastTickTime = Date.now();
      });
    }

    window.addEventListener('nomad-wake-resume', () => {
      lastTickTime = Date.now();
    });
  }

  // --- Initialize ---
  loadPersistedState();
  startClock();
  hookSensors();

  return {
    getState,
    addFix,
    simulateDriveStep,
    startTrip,
    pauseTrip,
    resumeTrip,
    togglePauseTrip,
    resetTrip,
    generateGPX: generateGPXString,
    exportGPX,
    onUpdate: (cb) => {
      subscribers.push(cb);
      try {
        cb(getState());
      } catch (_) {}
      return () => {
        const i = subscribers.indexOf(cb);
        if (i !== -1) subscribers.splice(i, 1);
      };
    }
  };
}));
