# NOMAD: Hyperspace (Version 4) & NOMAD: RoadTrip
> **Kinetic Telemetry, Navigation Avionics & Geospatial Data Architecture**  
> **Visionary & Creator:** BostonyFX ([@tony_bostony](https://www.instagram.com/tony_bostony/))

---

## 1. System Implementation & Architecture Overview

NOMAD operates as an ultra-responsive, browser-native avionics cockpit and telemetry instrument cluster. Originally conceived in **NOMAD: RoadTrip (Version 3)** as a high-visibility, modular road trip navigation HUD and evolved into **NOMAD: Hyperspace (Version 4)**, the architecture transforms raw smart device hardware sensors and low-latency geospatial web APIs into clean, structured, and visually decoupled telemetry streams.

Designed specifically for real-world vehicular environments, the core engine solves the instability inherent in consumer mobile hardware. Raw GPS jitter, multipath noise, and phone cabin vibration are conditioned through hardware-grade filtering: a stationary speed deadband clamps artificial drift to true zero MPH at stoplights, corridor axis constraints lock compass readings to physical highway travel grids, and asynchronous rate-limited polling preserves battery and thermal headroom. The presentation tier decouples data values from visual framing, allowing telemetry to float on autonomous Newtonian kinetic vectors, lock into stationary cockpit pins, or feed directly into text-based analytics, diagnostic clusters, and standard GPX flight logs.

---

## 2. Telemetry Data Objects & Dynamic Presentation

Every telemetry metric in NOMAD is encapsulated in a dedicated data object that bridges internal sensor measurements with flexible, viewport-responsive presentation blocks.

### A. Kinetic & Pinned Telemetry Bubbles (Hyperspace Engine)
NOMAD Hyperspace packages discrete telemetry data points into individual floating or pinned containers with curated geometric defaults, live fluid font scaling, and pure alpha contour isolation:

* **Speed Telemetry Object (`#speed-bubble`)**
  * **Data Payload**: Instantaneous ground speed, unit of measure (`MPH` or `KM/H`), speed status indicator.
  * **Curated Default Geometry**: Egg / Oval (`border-radius: 50% / 60% 60% 40% 40%`).
  * **Dynamic Sizing**: Proportional font scaling via `clamp()` across 3 preset scales (Compact 80px, Standard 104px, Hero 140px) or continuous granular slider (80px–150px).
  * **Frame Decoupling**: Dual-layer architecture (`#speed-bubble-shape-frame` outer boundary vs. `#speed-bubble-content` inner telemetry). Telemetry numerals remain strictly upright at 0° while the geometric container dynamically rotates based on live vehicle velocity or gyroscope heading.
  * **Physics Modes**: Stationary Pinned (drag & lock anywhere on screen grid) or Kinetic Bounce (Newtonian deflection off viewport walls with optional Safe Zone deflection).

* **Compass / Bearing Telemetry Object (`#cmps-bubble`)**
  * **Data Payload**: True heading / magnetic compass bearing (0°–359°), cardinal/intercardinal direction code (`N`, `NE`, `ENE`, `E`, etc.), and corridor axis lock.
  * **Curated Default Geometry**: Pentagon.
  * **Dynamic Sizing**: Responsive scaling keeping degree numerals and cardinal badges optically centered regardless of container width.

* **Weather & Temperature Telemetry Object (`#weather-bubble`)**
  * **Data Payload**: Ambient temperature (°F / °C), current weather condition icon, textual weather summary, and relative humidity percentage.
  * **Curated Default Geometry**: Squirkle (smooth continuous curvature).
  * **Atmospheric Scaling**: Boosted proportional icon sizing (20px SVGs) and scaled font floors (`clamp(1.02rem, 3.2vw, 1.25rem)`) for arm's-length automotive legibility.

* **Barometric Pressure Telemetry Object (`#baro-bubble`)**
  * **Data Payload**: Atmospheric sea-level pressure (`inHg` or `hPa`), dynamic pressure trend indicator (Rising, Falling, Steady), and UV Index.
  * **Curated Default Geometry**: Circle / Hexagon.

* **Coordinates & Navigation Telemetry Object (`#coords-bubble`)**
  * **Data Payload**: Dual-line high-precision coordinates (Latitude and Longitude to 6 decimal places).
  * **Curated Default Geometry**: Wobbling Rectangle / Rounded Brick (`rect`). Custom aspect-ratio geometry designed to cradle stacked coordinate strings without text wrapping or clipping.

* **Universal Bubble Styling & Transparency**:
  * **Crystalline Glass Tint**: Sheer glass backgrounds adapting dynamically to Dark Mode (`rgba(8, 14, 26, alpha)`) and Light Mode (`rgba(255, 255, 255, alpha)`), spanning 0% (Crystal Clear) to 80% (Dense Glass).
  * **Zero Artifacts**: Outer anchors enforce strict `background: transparent; border: none; box-shadow: none;` while alpha-channel `filter: drop-shadow(...)` guarantees glow effects match the true geometric contour.

---

### B. Location Channel Space Block & Telemetry Vault
Docked cleanly along the bottom of the viewport (`.dock-bottom`), this block surfaces high-level navigational context while acting as the bridge to hidden avionics data:

* **Primary Visual Plaque**:
  * **Street / Highway Name (`#street-name`)**: Live road name derived from reverse geocoding, constrained highway corridors, or manual route selection. Regular 400 font-weight with glassy border.
  * **City & State (`#city-state`)**: Current municipal boundary and state abbreviation.
  * **County & Postal Code (`#county-zip`)**: Secondary administrative district and zip code separated by a subtle cyan dot divider (`#loc-divider`).
  * **One-Touch Interactive Share**: Tapping the location block copies a formatted Google Maps navigation link to clipboard with instant pill feedback.

* **Hidden Telemetry Vault (`.hidden-telemetry-vault`)**:
  * An active, non-rendered DOM vault maintaining continuous real-time state for downstream consumers, text modes, and data bubbles without cluttering the main navigation interface:
    * `currentLatitude`, `currentLongitude`
    * `currentAltitudeMeters`, `currentAltitudeFeet`
    * `currentHeadingDegrees`, `currentHeadingCardinal`
    * `rawSpeedMps`, `clampedSpeedMph`, `clampedSpeedKmh`
    * `gpsAccuracyMeters`, `gpsTimestamp`

---

## 3. Hardware Sensors & Device APIs

NOMAD interfaces directly with modern smartphone and web hardware APIs without requiring third-party native wrappers:

* **W3C Geolocation API (`navigator.geolocation.watchPosition`)**:
  * Polled with `{ enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }`.
  * Extracts raw latitude, longitude, altitude (ellipsoidal), altitude accuracy, ground speed (m/s), heading (degrees true north), and timestamp.
  * **Stationary Deadband Filter**: Incorporates a hard zero-clamp filter for indoor GPS multipath drift and handheld cabin vibration (< 1.8 MPH), locking speed strictly to 0 MPH when stopped.

* **DeviceOrientation & Compass API (`DeviceOrientationEvent` / `webkitCompassHeading`)**:
  * Captures hardware magnetometer and gyroscope telemetry (`alpha`, `beta`, `gamma`).
  * Supports iOS Safari `webkitCompassHeading` for true hardware compass alignment and Android standard orientation vectors.
  * Includes permission request handshakes (`DeviceOrientationEvent.requestPermission()`) required on modern mobile operating systems.

* **Screen Wake Lock API (`navigator.wakeLock.request('screen')`)**:
  * Automatically requests and sustains an active display wake lock during navigation sessions to prevent device screen sleep or dimming while mounted in a vehicle.
  * Re-acquires wake locks automatically on window `visibilitychange` or app resume.

* **Web Audio API (`AudioContext`)**:
  * Zero-latency, low-overhead synthesized audio engine for avionics feedback (horn, laser, UI confirmation tones).
  * Hardware A2DP Bluetooth link pre-warming and sub-audible keep-alive buffers eliminate audio clipping and Bluetooth latency over vehicle speakers.

* **Clipboard API (`navigator.clipboard.writeText`)**:
  * Formats active coordinates and street addresses into standardized navigation URLs for rapid route sharing.

---

## 4. Cloud Services & Geospatial Web APIs

* **Carto / OpenStreetMap Vector Tile Services**:
  * Lightweight, vector tile schemas providing worldwide road geometries, land use, water boundaries, and building footprints.
  * Rendered via MapLibre GL with bespoke **Natural Dark Navigation** and **Natural Light Navigation** styling palettes.

* **Open-Meteo Weather Forecast & Atmospheric API**:
  * Real-time hyper-local atmospheric telemetry queried by coordinates.
  * Fetches temperature (2m), relative humidity, weather interpretation codes (WMO), surface pressure, and UV index.
  * Synchronized via a 10-minute cache invalidation model to eliminate redundant network traffic and API throttling.

* **OpenStreetMap Nominatim Reverse Geocoding API**:
  * Asynchronously transforms coordinate fixes (`lat, lon`) into structured address objects (road, suburb, town, city, county, state, postcode).
  * Spatial radius filtering prevents repetitive HTTP requests when the vehicle is stationary or moving under 15 meters from the previous resolution.

* **Interstate & Highway Route Shield Engine**:
  * Algorithmic route parser extracting interstate numbers (e.g. `I-95`, `I-90`) and state highway designations (e.g. `Route 128`).
  * Dynamically maps concurrent routes to dedicated SVG vector shields while enforcing primary corridor axis directionality.

---

## 5. Highway Grid Axis & Directional Intelligence

To eliminate erratic compass jitter caused by highway curvature or short-radius circumferential ramps, NOMAD implements the **Highway Corridor Grid Axis Engine (`getHighwayCorridorAxis`)**:

* **Odd-Numbered Interstates & North-South Highways** (e.g. I-95, I-93, Route 128):
  * Directional output is algorithmically constrained strictly to `North` or `South`.
* **Even-Numbered Interstates & East-West Turnpikes** (e.g. I-90 Mass Pike, I-84):
  * Directional output is algorithmically constrained strictly to `East` or `West`.
* **Directional Hysteresis Deadband**:
  * Applies a `±15°` travel heading deadband, preventing false direction flips when negotiating sweeping arcs along major circumferential highway corridors.
* **Corridor Shield Indicators**:
  * Maps direction dots (white dot for primary interstate, black dot for concurrent state route) directly to the verified corridor axis.

---

## 6. GEEK STATS: Diagnostics & Avionics Cluster

The **Geek Stats** telemetry monitor provides raw, unvarnished insight into the navigation subsystems and sensor health:

* **GNSS Precision & Satellite Geometry**:
  * Real-time GPS horizontal accuracy reported in meters and feet (`± accuracy`).
  * Update frequency and inter-packet latency (milliseconds elapsed between hardware position updates).
  * Timestamp of latest valid GNSS fix (epoch and local formatted time).
* **Altitude & Vertical Telemetry**:
  * Altitude above mean sea level (MSL) in meters and feet.
  * Vertical speed / climb rate indicator based on consecutive altitude differential (`Δalt / Δt`).
* **Coordinate Precision**:
  * 6-decimal latitude and longitude representation (approx. 11 cm ground resolution).
* **Sensor Health & Hardware Status**:
  * Compass sensor calibration state and magnetometer heading availability.
  * Network connectivity status, reverse geocode response times, and tile cache hit rates.

---

## 7. GPX Flight Recorder & Logging System

NOMAD includes a built-in telemetry logger for post-drive spatial analysis, performance auditing, and route archival:

* **GPX 1.1 Specification Compliance**:
  * Generates valid GPS Exchange Format (`.gpx`) XML schemas containing track segments (`<trk>`, `<trkseg>`, `<trkpt>`).
* **Logged Telemetry Attributes**:
  * `<trkpt lat="..." lon="...">`: High-precision coordinate pairs.
  * `<ele>`: Altitude in meters.
  * `<time>`: ISO 8601 UTC timestamp per point.
  * `<speed>`: Instantaneous ground velocity in meters/second.
  * `<course>`: Vehicle heading in true degrees.
* **Session Diagnostics & Export**:
  * Continuous background point capture during active navigation.
  * One-touch export triggering standard `.gpx` file download compatible with Strava, Google Earth, Garmin BaseCamp, and GIS platforms.

---

## 8. Central Version & Creator Registry (`version.js`)

All branding, version numbers, and creator links are maintained centrally in `/version.js` as the single source of truth across the entire application:

* **Active Brand Identity**: `NOMAD: Hyperspace` (Version 4) & `NOMAD: RoadTrip` (Version 3 Legacy).
* **Creator / Visionary Credits**: BostonyFX ([@tony_bostony](https://www.instagram.com/tony_bostony/)).
* **Version Registry Timezone Rule (US Eastern Time / ET)**:
  * Build timestamps strictly follow 24-hour US Eastern Time (ET: EDT/EST, UTC-4/UTC-5): `v4.[MMDDYYYY].[HHMM]`.
* **Automated Merge Tag Engine**:
  * Any view or document including `<script src="version.js"></script>` automatically hydrates standard merge tags on load:
    * `[merge_visionary]` &rarr; `NOMAD: Hyperspace by BostonyFX` (with live Instagram link)
    * `[merge_creator]` or `[merge_author]` &rarr; `BostonyFX` (with live Instagram link)
    * `[merge_footer]` &rarr; `NOMAD: Hyperspace Navigation Dashboard • Crafted by BostonyFX`
    * `[merge_version]` &rarr; Active build version string (e.g. `v4.09202026.0713`)
* **Semantic Target Classes**:
  * `<span class="nomad-brand"></span>`
  * `<span class="nomad-creator"></span>`
  * `<div class="nomad-footer"></div>`
  * `<span class="nomad-version"></span>`
* **Global About & Guide Overlay**:
  * Triggered globally via `window.openNomadAboutModal()`.
