/**
 * ====================================================================
 * NOMAD: SUITE — UNIFIED ATMOSPHERIC & WEATHER ENGINE
 * Silent Sensory Nervous System: Open-Meteo REST Client, Caching,
 * UV Safety Tiers, Barometric Conversions, WMO Vector Dictionary
 * 
 * Visionary & Creator: BostonyFX
 * Architecture: Pure Decoupled Event-Driven Provider (ZERO UI Manipulation)
 * File: /nomad_suite/js/nomad-weather-engine.js
 * ====================================================================
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NomadWeatherEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // --- Storage Keys ---
  const STORAGE_KEY_CACHE = 'nomad_suite_weather_cache';
  const STORAGE_KEY_INTERVAL_MIN = 'nomad_weather_interval_min';
  const STORAGE_KEY_DISTANCE_MI = 'nomad_weather_distance_mi';

  // --- Configuration Defaults ---
  let weatherTimeIntervalMinutes = 30;
  let weatherDistanceIntervalMiles = 15;

  try {
    const savedMin = localStorage.getItem(STORAGE_KEY_INTERVAL_MIN);
    if (savedMin) weatherTimeIntervalMinutes = parseInt(savedMin, 10);
    const savedMi = localStorage.getItem(STORAGE_KEY_DISTANCE_MI);
    if (savedMi) weatherDistanceIntervalMiles = parseInt(savedMi, 10);
  } catch (e) {
    // LocalStorage unavailable
  }

  // --- State Variables ---
  let isRunning = false;
  let lastLat = null;
  let lastLon = null;
  let lastWeatherFetchTime = 0;
  let lastWeatherLat = null;
  let lastWeatherLon = null;
  let unsubscribeTelemetry = null;

  // Atmospheric Telemetry In-Memory State
  let rawTempF = null;
  let rawTempC = null;
  let rawHumidityPercent = null;
  let rawPressureHpa = null;
  let rawPressureInHg = null;
  let rawUvIndex = null;
  let rawWeatherCode = null;
  let rawElevationMeters = null;
  let lastFetchedTimestamp = 0;

  const subscribers = [];

  // --- Helper Distance Calculator ---
  function getDistanceInMiles(lat1, lon1, lat2, lon2) {
    if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return 0;
    const R = 3958.8; // Earth radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // --- UV Color & Tier Resolver ---
  function getUvDetails(uv) {
    if (uv === null || uv === undefined || isNaN(uv)) {
      return { tier: 'UNKNOWN', color: '#ffb703', label: '--' };
    }
    const val = Number(uv);
    if (val < 3) {
      return { tier: 'LOW', color: '#4cd964', label: val.toFixed(1) };
    }
    if (val < 6) {
      return { tier: 'MODERATE', color: '#ffb703', label: val.toFixed(1) };
    }
    if (val < 8) {
      return { tier: 'HIGH', color: '#fb8500', label: val.toFixed(1) };
    }
    return { tier: 'VERY_HIGH', color: '#ff3b30', label: val.toFixed(1) };
  }

  // --- WMO Weather Code Dictionary & SVG Generator ---
  function getWeatherInfo(code) {
    const icons = {
      sun: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffcc00" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
      cloudSun: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M12 2v2" stroke="#ffcc00"/><path d="m4.93 4.93 1.41 1.41" stroke="#ffcc00"/><path d="M20 12h2" stroke="#ffcc00"/><path d="m19.07 4.93-1.41 1.41" stroke="#ffcc00"/><path d="M15.94 11.23a5 5 0 0 0-8.92 2.12 3.5 3.5 0 0 0 .98 6.65h8a4 4 0 0 0 .94-7.77z" stroke="#cbd5e1"/></svg>`,
      cloud: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M17.5 19H8.5a7 7 0 0 1-1.2-13.8 8 8 0 0 1 14.8 2.3 4.5 4.5 0 0 1-.6 11.5Z"/></svg>`,
      rain: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4fc3f7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M16 13v8"/><path d="M8 13v8"/><path d="M12 15v8"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" stroke="#cbd5e1"/></svg>`,
      thunder: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffd54f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
      snow: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"/><line x1="8" y1="16" x2="8.01" y2="16"/><line x1="16" y1="16" x2="16.01" y2="16"/></svg>`
    };

    const weatherMap = {
      0: { text: "Clear Sky", iconSvg: icons.sun },
      1: { text: "Mainly Clear", iconSvg: icons.cloudSun },
      2: { text: "Partly Cloudy", iconSvg: icons.cloudSun },
      3: { text: "Overcast", iconSvg: icons.cloud },
      45: { text: "Foggy", iconSvg: icons.cloud },
      48: { text: "Depositing Rime Fog", iconSvg: icons.cloud },
      51: { text: "Light Drizzle", iconSvg: icons.rain },
      53: { text: "Moderate Drizzle", iconSvg: icons.rain },
      55: { text: "Dense Drizzle", iconSvg: icons.rain },
      61: { text: "Slight Rain", iconSvg: icons.rain },
      63: { text: "Moderate Rain", iconSvg: icons.rain },
      65: { text: "Heavy Rain", iconSvg: icons.rain },
      71: { text: "Slight Snow", iconSvg: icons.snow },
      73: { text: "Moderate Snow", iconSvg: icons.snow },
      75: { text: "Heavy Snow", iconSvg: icons.snow },
      77: { text: "Snow Grains", iconSvg: icons.snow },
      80: { text: "Rain Showers", iconSvg: icons.rain },
      81: { text: "Heavy Rain Showers", iconSvg: icons.rain },
      82: { text: "Violent Rain Showers", iconSvg: icons.rain },
      85: { text: "Snow Showers", iconSvg: icons.snow },
      95: { text: "Thunderstorm", iconSvg: icons.thunder },
      96: { text: "Thunderstorm w/ Hail", iconSvg: icons.thunder },
      99: { text: "Heavy Hail Storm", iconSvg: icons.thunder }
    };

    return weatherMap[code] || { text: "Fair", iconSvg: icons.cloudSun };
  }

  // --- Snapshot Builder ---
  function buildWeatherSnapshot() {
    const uvInfo = getUvDetails(rawUvIndex);
    const condInfo = getWeatherInfo(rawWeatherCode);

    return {
      // Temperature
      tempF: rawTempF !== null ? Math.round(rawTempF * 10) / 10 : null,
      tempFInt: rawTempF !== null ? Math.round(rawTempF) : null,
      tempC: rawTempC !== null ? Math.round(rawTempC * 10) / 10 : null,
      tempCInt: rawTempC !== null ? Math.round(rawTempC) : null,

      // Humidity & Pressure
      humidity: rawHumidityPercent !== null ? Math.round(rawHumidityPercent) : null,
      pressureHpa: rawPressureHpa !== null ? Math.round(rawPressureHpa * 10) / 10 : null,
      pressureInHg: rawPressureInHg !== null ? Math.round(rawPressureInHg * 100) / 100 : null,

      // UV Exposure
      uvIndex: rawUvIndex !== null ? Number(rawUvIndex.toFixed(1)) : null,
      uvTier: uvInfo.tier,
      uvColor: uvInfo.color,
      uvDisplay: uvInfo.label,

      // WMO Condition
      weatherCode: rawWeatherCode,
      conditionText: condInfo.text,
      conditionIconSvg: condInfo.iconSvg,

      // Elevation
      elevationMeters: rawElevationMeters !== null ? Math.round(rawElevationMeters) : null,
      elevationFeet: rawElevationMeters !== null ? Math.round(rawElevationMeters * 3.28084) : null,

      // Metadata
      timestamp: lastFetchedTimestamp,
      latitude: lastWeatherLat,
      longitude: lastWeatherLon,
      isLoaded: (rawTempF !== null)
    };
  }

  function emitUpdate() {
    const snapshot = buildWeatherSnapshot();

    // Call registered subscribers
    for (let i = 0; i < subscribers.length; i++) {
      try {
        subscribers[i](snapshot);
      } catch (err) {
        console.error('NomadWeatherEngine subscriber error:', err);
      }
    }

    // Dispatch DOM event for custom decoupled listeners
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('nomad-weather', { detail: snapshot }));
      } catch (e) {
        // Ignore fallback errors
      }
    }
  }

  // --- Cache Management ---
  function loadCache() {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_CACHE);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed.tempF === 'number') {
          rawTempF = parsed.tempF;
          rawTempC = parsed.tempC !== undefined ? parsed.tempC : ((parsed.tempF - 32) * 5 / 9);
          rawHumidityPercent = parsed.humidity;
          rawPressureHpa = parsed.pressureHpa;
          rawPressureInHg = parsed.pressureInHg !== undefined ? parsed.pressureInHg : (parsed.pressureHpa ? parsed.pressureHpa * 0.0295299830714 : null);
          rawUvIndex = parsed.uv;
          rawWeatherCode = parsed.weatherCode;
          rawElevationMeters = parsed.elevationMeters;
          lastWeatherLat = parsed.lat;
          lastWeatherLon = parsed.lon;
          lastFetchedTimestamp = parsed.timestamp || 0;
          emitUpdate();
        }
      }
    } catch (e) {
      // Ignore cache parse error
    }
  }

  function saveCache() {
    try {
      localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify({
        tempF: rawTempF,
        tempC: rawTempC,
        humidity: rawHumidityPercent,
        pressureHpa: rawPressureHpa,
        pressureInHg: rawPressureInHg,
        uv: rawUvIndex,
        weatherCode: rawWeatherCode,
        elevationMeters: rawElevationMeters,
        lat: lastWeatherLat,
        lon: lastWeatherLon,
        timestamp: lastFetchedTimestamp
      }));
    } catch (e) {
      // Ignore storage errors
    }
  }

  // --- Weather Fetch Engine ---
  async function fetchWeather(lat, lon, force = false) {
    if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) return;
    const now = Date.now();
    const timeThresholdMs = weatherTimeIntervalMinutes * 60 * 1000;
    let shouldFetch = force;

    if (!shouldFetch) {
      if (lastWeatherFetchTime === 0 || rawHumidityPercent === null || rawTempF === null) {
        shouldFetch = true;
      } else {
        const timePassed = now - lastWeatherFetchTime;
        if (timePassed >= timeThresholdMs) shouldFetch = true;

        if (!shouldFetch && weatherDistanceIntervalMiles > 0 && lastWeatherLat !== null && lastWeatherLon !== null) {
          const milesMoved = getDistanceInMiles(lastWeatherLat, lastWeatherLon, lat, lon);
          if (milesMoved >= weatherDistanceIntervalMiles) shouldFetch = true;
        }
      }
    }

    if (!shouldFetch) return;

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=temperature_2m,relative_humidity_2m,weather_code,uv_index,surface_pressure,pressure_msl&temperature_unit=fahrenheit&timezone=auto`;
      const response = await fetch(url);
      if (!response.ok) return;
      const data = await response.json();
      if (!data || !data.current) return;

      lastWeatherFetchTime = now;
      lastWeatherLat = lat;
      lastWeatherLon = lon;
      lastFetchedTimestamp = now;

      // Extract & Convert Values
      const cur = data.current;
      rawTempF = cur.temperature_2m;
      rawTempC = (rawTempF - 32) * 5 / 9;

      if (cur.pressure_msl !== undefined && cur.pressure_msl !== null) {
        rawPressureHpa = cur.pressure_msl;
      } else if (cur.surface_pressure !== undefined && cur.surface_pressure !== null) {
        rawPressureHpa = cur.surface_pressure;
      } else {
        rawPressureHpa = 1013.25;
      }
      rawPressureInHg = rawPressureHpa * 0.0295299830714;

      rawHumidityPercent = cur.relative_humidity_2m !== undefined ? cur.relative_humidity_2m : null;
      rawUvIndex = cur.uv_index !== undefined ? cur.uv_index : null;
      rawWeatherCode = cur.weather_code !== undefined ? cur.weather_code : 0;

      if (data.elevation !== undefined) {
        rawElevationMeters = data.elevation;
      }

      saveCache();
      emitUpdate();
    } catch (err) {
      console.warn('NomadWeatherEngine fetch warning:', err);
    }
  }

  // --- Public API ---
  function start() {
    if (isRunning) return;
    isRunning = true;

    // 1. Immediately load cache so UI has zero delay
    loadCache();

    // 2. Automatically listen to NomadTelemetryEngine if available
    if (typeof window !== 'undefined') {
      if (window.NomadTelemetryEngine) {
        unsubscribeTelemetry = window.NomadTelemetryEngine.onUpdate((telemetry) => {
          if (telemetry.latitude !== null && telemetry.longitude !== null) {
            lastLat = telemetry.latitude;
            lastLon = telemetry.longitude;
            fetchWeather(lastLat, lastLon, false);
          }
        });
      }

      // Also listen to window event in case telemetry initialized separately
      window.addEventListener('nomad-telemetry', (e) => {
        if (e.detail && e.detail.latitude !== null && e.detail.longitude !== null) {
          lastLat = e.detail.latitude;
          lastLon = e.detail.longitude;
          fetchWeather(lastLat, lastLon, false);
        }
      });
    }
  }

  function stop() {
    if (!isRunning) return;
    isRunning = false;
    if (unsubscribeTelemetry) {
      unsubscribeTelemetry();
      unsubscribeTelemetry = null;
    }
  }

  function onUpdate(callback) {
    if (typeof callback !== 'function') return () => {};
    subscribers.push(callback);
    // If state is already available, trigger immediately
    if (rawTempF !== null) {
      try {
        callback(buildWeatherSnapshot());
      } catch (e) {
        console.error(e);
      }
    }
    return function unsubscribe() {
      const index = subscribers.indexOf(callback);
      if (index !== -1) {
        subscribers.splice(index, 1);
      }
    };
  }

  function refreshNow() {
    if (lastLat !== null && lastLon !== null) {
      return fetchWeather(lastLat, lastLon, true);
    } else if (lastWeatherLat !== null && lastWeatherLon !== null) {
      return fetchWeather(lastWeatherLat, lastWeatherLon, true);
    }
  }

  function setTimeInterval(minutes) {
    weatherTimeIntervalMinutes = Number(minutes);
    try {
      localStorage.setItem(STORAGE_KEY_INTERVAL_MIN, minutes);
    } catch (_) {}
  }

  function setDistanceInterval(miles) {
    weatherDistanceIntervalMiles = Number(miles);
    try {
      localStorage.setItem(STORAGE_KEY_DISTANCE_MI, miles);
    } catch (_) {}
  }

  return {
    start,
    stop,
    fetchWeather,
    refreshNow,
    onUpdate,
    subscribe: onUpdate,
    getState: buildWeatherSnapshot,
    setTimeInterval,
    setDistanceInterval,
    getTimeInterval: () => weatherTimeIntervalMinutes,
    getDistanceInterval: () => weatherDistanceIntervalMiles,
    getWeatherInfo,
    getUvDetails
  };
}));
