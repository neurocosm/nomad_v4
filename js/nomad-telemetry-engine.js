/**
 * ====================================================================
 * NOMAD: SUITE — UNIFIED TELEMETRY & LOCATION ENGINE
 * Avionics Core: GNSS Watcher, Noise Clamping, AASHTO Corridor Grid,
 * Reverse Geocoding & Stationary Intersection Lock
 * 
 * Visionary & Creator: BostonyFX
 * Architecture: Pure Decoupled Event-Driven Provider
 * File: /nomad_suite/js/nomad-telemetry-engine.js
 * ====================================================================
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.NomadTelemetryEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // --- 50 US States Abbreviation Map ---
  const STATE_ABBRS = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
    'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
    'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
    'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
    'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
    'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
    'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
    'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
    'District of Columbia': 'DC'
  };

  // --- Standard Street Suffix Abbreviations ---
  const STREET_SUFFIX_MAP = [
    [/\bStreet\b/gi, 'St.'],
    [/\bAvenue\b/gi, 'Ave.'],
    [/\bRoad\b/gi, 'Rd.'],
    [/\bBoulevard\b/gi, 'Blvd.'],
    [/\bDrive\b/gi, 'Dr.'],
    [/\bLane\b/gi, 'Ln.'],
    [/\bCourt\b/gi, 'Ct.'],
    [/\bPlace\b/gi, 'Pl.'],
    [/\bCircle\b/gi, 'Cir.'],
    [/\bParkway\b/gi, 'Pkwy.'],
    [/\bTurnpike\b/gi, 'Tpke.'],
    [/\bHighway\b/gi, 'Hwy.'],
    [/\bExpressway\b/gi, 'Expy.'],
    [/\bSquare\b/gi, 'Sq.'],
    [/\bWay\b/gi, 'Way']
  ];

  // --- Internal State ---
  let isRunning = false;
  let watchId = null;
  let hasRealGpsLock = false;

  let currentLat = null;
  let currentLon = null;
  let rawAltitudeMeters = null;
  let rawAccuracyMeters = null;
  let rawSpeedMps = 0;
  let filteredSpeedMps = 0;
  let currentHeading = 0;
  let hasValidHeading = false;

  // Stationary & Reverse Geocoding Control
  let stationaryLockActive = false;
  let stationaryAnchorLat = null;
  let stationaryAnchorLon = null;
  let lastPositionUpdateLat = null;
  let lastPositionUpdateLon = null;
  let travelDistanceOnCurrentRoadMeters = 0;
  let lastGeocodeTime = 0;
  let lastGeocodeLat = null;
  let lastGeocodeLon = null;
  let hasInitialGeocode = false;

  // Active Resolved Location Elements
  let currentStreetName = 'Locating...';
  let currentCityState = '';
  let currentCountyZip = '';
  let currentPrimaryRoute = null;
  let currentHighwayDirection = '';
  let currentCorridorAxis = 'any';
  let currentInterstateShield = null;
  let currentRouteShield = null;
  let currentSecondaryRouteShield = null;

  // Signed highway direction memory for hysteresis
  const currentSignedHighwayDirections = {};

  // Subscribers array
  const subscribers = [];

  // --- Helper Math Functions ---

  function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
    if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return 0;
    const R = 6371000; // Radius of Earth in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function getCardinalDirection(angle) {
    if (angle === null || isNaN(angle)) return 'N';
    const norm = ((Math.round(angle) % 360) + 360) % 360;
    const octant = Math.round(norm / 45) % 8;
    const compassDirections = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return compassDirections[octant];
  }

  function getFullCardinalWord(angle) {
    if (angle === null || isNaN(angle)) return 'NORTH';
    const norm = ((Math.round(angle) % 360) + 360) % 360;
    const octant = Math.round(norm / 45) % 8;
    const words = ['NORTH', 'NORTHEAST', 'EAST', 'SOUTHEAST', 'SOUTH', 'SOUTHWEST', 'WEST', 'NORTHWEST'];
    return words[octant];
  }

  function formatStreetName(rawName) {
    if (!rawName) return '';
    let formatted = rawName.trim();
    for (const [pattern, replacement] of STREET_SUFFIX_MAP) {
      formatted = formatted.replace(pattern, replacement);
    }
    return formatted;
  }

  function formatStateAbbr(stateName) {
    if (!stateName) return '';
    return STATE_ABBRS[stateName.trim()] || stateName.trim();
  }

  // --- AASHTO Highway Corridor Grid Axis Logic ---

  function getHighwayCorridorAxis(routeNumber, highwayType = '') {
    if (!routeNumber) return 'any';
    const clean = String(routeNumber).toUpperCase().trim();

    const isInterstate = highwayType === 'interstate' || /^I[-\s]?\d+/i.test(clean) || clean === 'INTERSTATE';
    const isUS = highwayType === 'us' || /^US[-\s]?\d+/i.test(clean);
    const isState = highwayType === 'state' || /^(?:RT|ROUTE|SR|MA)[-\s]?\d+/i.test(clean);

    const numMatch = clean.match(/\d+/);
    const num = numMatch ? parseInt(numMatch[0], 10) : null;

    if (num !== null) {
      // Prominent designated state corridors (e.g. Route 128 is officially signed North/South by MassDOT)
      if (num === 128) return 'north-south';
      if ([3, 24, 140, 12, 8, 7, 28, 38].includes(num)) return 'north-south';
      if ([2, 9, 20, 30, 119].includes(num)) return 'east-west';

      // Interstate Highway Grid (AASHTO standard: Odd = North/South, Even = East/West)
      if (isInterstate || (!isUS && !isState && (num === 95 || num === 93 || num === 90 || num === 84 || num === 80 || num === 91 || num === 87 || num === 495 || num === 290 || num === 195 || num === 295 || num === 395))) {
        const baseNum = num >= 100 ? (num % 100) : num;
        return (baseNum % 2 === 1) ? 'north-south' : 'east-west';
      }

      // US Highway Grid (Odd = North/South, Even = East/West)
      if (isUS) {
        return (num % 2 === 1) ? 'north-south' : 'east-west';
      }

      // General state route fallback
      if (isState) {
        return (num % 2 === 1) ? 'north-south' : 'east-west';
      }
    }

    return 'any';
  }

  function getHighwayDirection(routeNumber, heading, highwayType = '') {
    if (heading === null || isNaN(heading)) return '';
    const cleanNum = String(routeNumber).toUpperCase().trim();
    const norm = (heading % 360 + 360) % 360;
    const prevDirection = currentSignedHighwayDirections[cleanNum] || null;
    const axis = getHighwayCorridorAxis(routeNumber, highwayType);

    let newDirection = '';

    if (axis === 'north-south') {
      // North-South corridor (e.g. I-95, I-93, Route 128, US-1)
      // Northerly half: [270°..90°], Southerly half: [90°..270°]
      // ±15° hysteresis deadband around 90° and 270° prevents jitter on curved arcs
      if (prevDirection === 'North') {
        if (norm > 105 && norm < 255) newDirection = 'South';
        else newDirection = 'North';
      } else if (prevDirection === 'South') {
        if (norm < 75 || norm > 285) newDirection = 'North';
        else newDirection = 'South';
      } else {
        newDirection = (norm >= 90 && norm <= 270) ? 'South' : 'North';
      }
    } else if (axis === 'east-west') {
      // East-West corridor (e.g. I-90 Mass Pike, I-84, Route 2, Route 9)
      // Easterly half: [0°..180°], Westerly half: [180°..360°]
      // ±15° hysteresis deadband around 0° and 180°
      if (prevDirection === 'East') {
        if (norm > 195 && norm < 345) newDirection = 'West';
        else newDirection = 'East';
      } else if (prevDirection === 'West') {
        if (norm > 15 && norm < 165) newDirection = 'East';
        else newDirection = 'West';
      } else {
        newDirection = (norm >= 0 && norm < 180) ? 'East' : 'West';
      }
    } else {
      // Full 4-quadrant cardinal direction with ±12° hysteresis deadband
      if (prevDirection === 'North') {
        if (norm >= 57 && norm <= 135) newDirection = 'East';
        else if (norm > 135 && norm <= 225) newDirection = 'South';
        else if (norm > 225 && norm <= 303) newDirection = 'West';
        else newDirection = 'North';
      } else if (prevDirection === 'East') {
        if (norm <= 33 || norm >= 315) newDirection = 'North';
        else if (norm >= 147 && norm <= 225) newDirection = 'South';
        else if (norm > 225 && norm < 315) newDirection = 'West';
        else newDirection = 'East';
      } else if (prevDirection === 'South') {
        if (norm >= 45 && norm <= 123) newDirection = 'East';
        else if (norm < 45 || norm >= 315) newDirection = 'North';
        else if (norm >= 237 && norm <= 315) newDirection = 'West';
        else newDirection = 'South';
      } else if (prevDirection === 'West') {
        if (norm <= 45 || norm >= 327) newDirection = 'North';
        else if (norm >= 135 && norm <= 213) newDirection = 'South';
        else if (norm > 45 && norm < 135) newDirection = 'East';
        else newDirection = 'West';
      } else {
        if (norm >= 315 || norm < 45) newDirection = 'North';
        else if (norm >= 45 && norm < 135) newDirection = 'East';
        else if (norm >= 135 && norm < 225) newDirection = 'South';
        else newDirection = 'West';
      }
    }

    currentSignedHighwayDirections[cleanNum] = newDirection;
    return newDirection;
  }

  // --- Snapshot Builder ---

  function buildTelemetrySnapshot() {
    const speedMph = filteredSpeedMps > 0 ? (filteredSpeedMps * 2.23694) : 0;
    const speedKmh = filteredSpeedMps > 0 ? (filteredSpeedMps * 3.6) : 0;
    const altitudeFeet = rawAltitudeMeters !== null ? Math.round(rawAltitudeMeters * 3.28084) : null;
    const accuracyFeet = rawAccuracyMeters !== null ? Math.round(rawAccuracyMeters * 3.28084) : null;

    return {
      // Speed
      speedMph: Math.round(speedMph * 10) / 10,
      speedMphInt: Math.round(speedMph),
      speedKmh: Math.round(speedKmh * 10) / 10,
      speedKmhInt: Math.round(speedKmh),
      rawSpeedMps: filteredSpeedMps,
      isStationary: (filteredSpeedMps === 0),

      // Heading & Bearing
      headingDeg: Math.round(currentHeading),
      headingRaw: currentHeading,
      hasValidHeading: hasValidHeading,
      cardinalShort: getCardinalDirection(currentHeading),
      cardinalWord: getFullCardinalWord(currentHeading),

      // Geographic Coordinates & Elevation
      latitude: currentLat !== null ? Number(currentLat.toFixed(6)) : null,
      longitude: currentLon !== null ? Number(currentLon.toFixed(6)) : null,
      altitudeMeters: rawAltitudeMeters !== null ? Math.round(rawAltitudeMeters) : null,
      altitudeFeet: altitudeFeet,
      accuracyMeters: rawAccuracyMeters !== null ? Math.round(rawAccuracyMeters) : null,
      accuracyFeet: accuracyFeet,
      hasRealGpsLock: hasRealGpsLock,

      // Location & Corridor Context
      streetName: currentStreetName,
      cityState: currentCityState,
      countyZip: currentCountyZip,
      primaryRoute: currentPrimaryRoute,
      highwayDirection: currentHighwayDirection,
      corridorAxis: currentCorridorAxis,
      interstateShield: currentInterstateShield,
      routeShield: currentRouteShield,
      secondaryRouteShield: currentSecondaryRouteShield,

      // Timestamp
      timestamp: Date.now()
    };
  }

  function emitUpdate() {
    const snapshot = buildTelemetrySnapshot();

    // Call registered subscribers
    for (let i = 0; i < subscribers.length; i++) {
      try {
        subscribers[i](snapshot);
      } catch (err) {
        console.error('NomadTelemetryEngine subscriber error:', err);
      }
    }

    // Dispatch DOM event for custom decoupled listeners
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('nomad-telemetry', { detail: snapshot }));
      } catch (e) {
        // Ignore fallback errors
      }
    }
  }

  // --- Reverse Geocoding & Stationary Intersection Lock ---

  async function fetchLocationDetails(lat, lon, speed, forceImmediate = false) {
    const now = Date.now();
    const speedMph = (speed !== null && !isNaN(speed)) ? (speed * 2.23694) : 0;

    // Track distance moved since last position check
    if (lastPositionUpdateLat !== null && lastPositionUpdateLon !== null) {
      const stepDist = getDistanceFromLatLonInMeters(lastPositionUpdateLat, lastPositionUpdateLon, lat, lon);
      travelDistanceOnCurrentRoadMeters += stepDist;
    }
    lastPositionUpdateLat = lat;
    lastPositionUpdateLon = lon;

    // 1. STATIONARY LOCK ENGINE (Solves Intersection Hopping & Stoplight Drift)
    // When vehicle is stopped or moving at crawl speed (< 2.8 MPH), lock current road name if stable
    if (speedMph < 2.8 && !forceImmediate && hasInitialGeocode) {
      if (!stationaryLockActive) {
        stationaryLockActive = true;
        stationaryAnchorLat = lat;
        stationaryAnchorLon = lon;
      } else if (stationaryAnchorLat !== null && stationaryAnchorLon !== null) {
        const driftDist = getDistanceFromLatLonInMeters(stationaryAnchorLat, stationaryAnchorLon, lat, lon);
        // If within 25m stoplight GPS error ellipse, keep stable street name
        if (driftDist < 25) {
          return;
        }
      }
    } else if (speedMph >= 2.8) {
      // Vehicle is moving; disengage stationary lock
      stationaryLockActive = false;
      stationaryAnchorLat = null;
      stationaryAnchorLon = null;
    }

    // Throttle lookups to at most once every 3.5s when moving, unless forced
    if (hasInitialGeocode && !forceImmediate) {
      if (now - lastGeocodeTime < 3500) return;
      if (lastGeocodeLat !== null && lastGeocodeLon !== null) {
        const distMoved = getDistanceFromLatLonInMeters(lastGeocodeLat, lastGeocodeLon, lat, lon);
        if (distMoved < 40) return; // Do not waste API calls if moved less than 40 meters
      }
    }

    lastGeocodeTime = now;
    lastGeocodeLat = lat;
    lastGeocodeLon = lon;

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
      const response = await fetch(url, { headers: { 'Accept-Language': 'en-US,en;q=0.9' } });
      if (!response.ok) return;
      const data = await response.json();
      if (!data || !data.address) return;

      const addr = data.address;
      hasInitialGeocode = true;

      // Extract City/Town
      const city = addr.city || addr.town || addr.village || addr.municipality || addr.hamlet || addr.suburb || '';
      const stateAbbr = formatStateAbbr(addr.state || '');
      const county = (addr.county || '').replace(/\s+County$/i, '');
      const postcode = addr.postcode ? addr.postcode.split('-')[0] : '';

      // Route Detection & Singularity Logic
      let road = addr.road || addr.pedestrian || addr.footway || addr.cycleway || addr.path || '';
      let detectedInterstate = null;
      let detectedRoute = null;
      let secondaryRoute = null;

      const cleanRoad = road.toUpperCase();

      // Interstate matching (e.g. "I 95", "Interstate 95", "I-95 North")
      const interstateMatch = cleanRoad.match(/(?:INTERSTATE|I[-\s])\s*(\d+)/i);
      if (interstateMatch) {
        detectedInterstate = interstateMatch[1];
      }

      // State or US Route matching (e.g. "Route 128", "US 1", "MA-128", "State Hwy 24")
      const routeMatch = cleanRoad.match(/(?:ROUTE|RT|US[-\s]?HIGHWAY|STATE[-\s]?HWY|SR|MA)[-\s]?(\d+)/i);
      if (routeMatch) {
        detectedRoute = routeMatch[1];
      }

      // Detect concurrent multiplexes (e.g. "I-95 / Route 128")
      if (detectedInterstate && (cleanRoad.includes('128') || cleanRoad.includes('ROUTE 128') || cleanRoad.includes('RT 128'))) {
        secondaryRoute = '128';
      }

      currentInterstateShield = detectedInterstate;
      currentRouteShield = detectedRoute;
      currentSecondaryRouteShield = secondaryRoute;

      // Determine Primary Route Header Singularity
      let primaryRouteHeader = '';
      if (detectedInterstate) {
        const dir = getHighwayDirection(detectedInterstate, currentHeading, 'interstate');
        primaryRouteHeader = `I-${detectedInterstate}${dir ? ' ' + dir : ''}`;
        currentHighwayDirection = dir;
        currentCorridorAxis = getHighwayCorridorAxis(detectedInterstate, 'interstate');
      } else if (detectedRoute) {
        const dir = getHighwayDirection(detectedRoute, currentHeading, 'state');
        primaryRouteHeader = `Route ${detectedRoute}${dir ? ' ' + dir : ''}`;
        currentHighwayDirection = dir;
        currentCorridorAxis = getHighwayCorridorAxis(detectedRoute, 'state');
      } else if (road) {
        primaryRouteHeader = formatStreetName(road);
        currentHighwayDirection = '';
        currentCorridorAxis = 'any';
      } else {
        primaryRouteHeader = 'Local Road';
        currentHighwayDirection = '';
        currentCorridorAxis = 'any';
      }

      currentPrimaryRoute = (detectedInterstate ? `I-${detectedInterstate}` : (detectedRoute ? `Route ${detectedRoute}` : null));
      currentStreetName = primaryRouteHeader;

      // Format City, State
      if (city && stateAbbr) {
        currentCityState = `${city}, ${stateAbbr}`;
      } else if (city) {
        currentCityState = city;
      } else if (stateAbbr) {
        currentCityState = stateAbbr;
      } else {
        currentCityState = '';
      }

      // Format County, Zip
      if (county && postcode) {
        currentCountyZip = `${county} • ${postcode}`;
      } else if (county) {
        currentCountyZip = county;
      } else if (postcode) {
        currentCountyZip = postcode;
      } else {
        currentCountyZip = '';
      }

      emitUpdate();
    } catch (e) {
      console.warn('NomadTelemetryEngine reverse geocode warning:', e);
    }
  }

  // --- Position Update Handler ---

  function handlePositionUpdate(position, isIp = false) {
    if (!position || !position.coords) return;
    const { latitude, longitude, heading, speed, altitude, accuracy } = position.coords;

    // If we already have real satellite GPS lock, reject low-accuracy IP estimate
    if (hasRealGpsLock && isIp) return;

    const wasIpEstimate = !hasRealGpsLock;
    if (!isIp) {
      hasRealGpsLock = true;
    }

    currentLat = latitude;
    currentLon = longitude;
    rawAltitudeMeters = altitude !== undefined ? altitude : null;
    rawAccuracyMeters = accuracy !== undefined ? accuracy : null;

    // 2. STATIONARY NOISE FILTER & VELOCITY CLAMP
    // Multipath reflections indoors & phone vibrations create artificial micro-velocities (0.3 - 1.2 m/s = 1 - 3 MPH).
    // Clamping rule: Ignore velocities below 1.8 MPH (0.8 m/s), or below 2.5 MPH when accuracy is poor (> 20m).
    let speedMps = speed;
    if (speedMps !== null && !isNaN(speedMps)) {
      const rawMph = speedMps * 2.23694;
      if (rawMph < 1.8) {
        speedMps = 0;
      } else if (rawAccuracyMeters && rawAccuracyMeters > 20 && rawMph < 2.5) {
        speedMps = 0;
      }
    } else {
      speedMps = 0;
    }

    rawSpeedMps = speed !== null && !isNaN(speed) ? speed : 0;
    filteredSpeedMps = speedMps;

    // Update Heading if valid
    if (heading !== null && !isNaN(heading)) {
      currentHeading = (heading % 360 + 360) % 360;
      hasValidHeading = true;
    }

    // Force geocode if transitioning from IP to satellite, or on big initial jump
    const forceGeocode = (wasIpEstimate && !isIp);
    if (forceGeocode) {
      stationaryLockActive = false;
      stationaryAnchorLat = null;
      stationaryAnchorLon = null;
      lastGeocodeTime = 0;
    }

    emitUpdate();

    // Trigger reverse geocoding asynchronously
    fetchLocationDetails(latitude, longitude, speedMps, forceGeocode);
  }

  // --- Cold Boot IP Fallback ---

  async function fetchIpLocationFallback() {
    if (hasRealGpsLock || (currentLat !== null && currentLon !== null)) return;
    try {
      const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.latitude && data.longitude) {
        const lat = parseFloat(data.latitude);
        const lon = parseFloat(data.longitude);
        if (!isNaN(lat) && !isNaN(lon) && !hasRealGpsLock) {
          handlePositionUpdate({
            coords: {
              latitude: lat,
              longitude: lon,
              heading: null,
              speed: 0,
              altitude: null,
              accuracy: 5000
            }
          }, true);
        }
      }
    } catch (e) {
      console.warn('IP fallback unavailable:', e);
    }
  }

  // --- Public API ---

  function start() {
    if (isRunning) return;
    isRunning = true;

    // 1. Kick off instant IP/Wi-Fi bootstrap
    fetchIpLocationFallback();

    // 2. Start high-precision satellite watcher
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => handlePositionUpdate(pos, false),
        (err) => console.warn('GNSS watch warning:', err.message),
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 1000
        }
      );
    } else {
      console.warn('Geolocation not supported in this environment');
    }
  }

  function stop() {
    if (!isRunning) return;
    isRunning = false;
    if (watchId !== null && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  }

  function onUpdate(callback) {
    if (typeof callback !== 'function') return () => {};
    subscribers.push(callback);
    // If state is already available, trigger immediately
    if (currentLat !== null) {
      try {
        callback(buildTelemetrySnapshot());
      } catch (e) {
        console.error(e);
      }
    }
    // Return unsubscribe function
    return function unsubscribe() {
      const index = subscribers.indexOf(callback);
      if (index !== -1) {
        subscribers.splice(index, 1);
      }
    };
  }

  function setHeadingManual(headingDeg) {
    if (headingDeg !== null && !isNaN(headingDeg)) {
      currentHeading = (headingDeg % 360 + 360) % 360;
      hasValidHeading = true;
      emitUpdate();
    }
  }

  return {
    start,
    stop,
    onUpdate,
    subscribe: onUpdate,
    getState: buildTelemetrySnapshot,
    setHeadingManual,
    getHighwayCorridorAxis,
    getHighwayDirection,
    getCardinalDirection,
    getFullCardinalWord,
    formatStreetName,
    formatStateAbbr,
    getDistanceFromLatLonInMeters
  };
}));
