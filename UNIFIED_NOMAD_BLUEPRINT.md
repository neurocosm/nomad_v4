# NOMAD UNIFIED COCKPIT SUITE: MASTER BLUEPRINT & MIGRATION DIRECTIVE
> **Consolidation of NOMAD RoadTrip (v3), NOMAD Hyperspace (v4), and NOMAD DIGIT**  
> **Visionary & Creator:** BostonyFX ([@neurocosm](https://www.instagram.com/neurocosm))  
> **Status:** Architecture Plan & Ground-Truth Directive  

---

## ⚠️ MANDATORY OPERATING DIRECTIVE: READ THIS FIRST ⚠️

```
================================================================================
CRITICAL AGENT INSTRUCTION FOR THE NEW PROJECT:
DO NOT CODE ANYTHING IN THE NEW PROJECT UNTIL YOU DISCUSS IT WITH THE USER
AND CONFIRM BOTH OF YOU ARE ON THE EXACT SAME PAGE.

1. When initializing the new project, the assistant MUST first inspect and acknowledge 
   this blueprint and the /ground_truth/ reference archives.
2. Present a concise status assessment to the user and await explicit confirmation 
   before creating or modifying any new production files.
3. Every step MUST follow the "One Step at a Time" discipline: implement one piece,
   verify it completely with the user, and never stack unverified code edits.
================================================================================
```

---

## 1. Project Vision & Architecture Goal

The objective of the **NOMAD Unified Cockpit Suite** is to merge three distinct, complete, and verified navigation experiences into a single, high-performance web application powered by **one shared, aerospace-grade avionics core**:

```
                       ┌──────────────────────────────────────┐
                       │      SHARED AVIONICS CORE ENGINE     │
                       │  GPS • Deadband • Heading • Weather  │
                       └──────────────────┬───────────────────┘
                                          │
                  ┌───────────────────────┼───────────────────────┐
                  ▼                       ▼                       ▼
       ┌────────────────────┐   ┌────────────────────┐   ┌────────────────────┐
       │   NOMAD ROADTRIP   │   │  NOMAD HYPERSPACE  │   │    NOMAD DIGIT     │
       │   Classic V3 HUD   │   │   Kinetic V4 HUD   │   │ Text 5-Block Stack │
       │ (Structured Gauges)│   │ (Floating Bubbles) │   │ (Tactical Density) │
       └────────────────────┘   └────────────────────┘   └────────────────────┘
                  ▲                       ▲                       ▲
                  └───────────────────────┴───────────────────────┘
                                          │
                       ┌──────────────────┴───────────────────┐
                       │     INSTANT COCKPIT MODE SELECTOR    │
                       │  Startup Picker + Zero-Reload Header │
                       └──────────────────────────────────────┘
```

### The Three Pluggable Cockpit Experiences:
1. **NOMAD RoadTrip (Version 3)**:
   * **Personality**: Order, structure, road-trip clarity, classic automotive HUD.
   * **Key Components**: Fixed speed limit sign pod, tactical compass rose, stacked atmospheric weather stats, route badges, and framed vector map.
2. **NOMAD Hyperspace (Version 4)**:
   * **Personality**: Edge-to-edge immersion, playful dynamic geometry, kinetic personality.
   * **Key Components**: Full-bleed vector map, minimal glassy top toggles, vehicle safe-zone forcefield, and Newtonian floating data bubbles (Egg, Squirkle, Wobble Rectangle, etc.) with customizable physics and dynamic shape rotation.
3. **NOMAD DIGIT (Text-Only Tactical)**:
   * **Personality**: Pure data density, distraction-free, maximum battery efficiency.
   * **Key Components**: 5 horizontal rounded rectangular blocks (Location &rarr; Motion &rarr; Weather &rarr; Chronometry &rarr; Philosophy) tailored to a non-scrolling 100dvh mobile viewport.

---

## 2. The "Ground Truth" Archive Strategy

To protect the user's hard work and guarantee 100% aesthetic and functional fidelity, the new project will contain a dedicated, **read-only `/ground_truth/` directory**:

```text
/ground_truth/
  ├── roadtrip/       <- Complete, verified RoadTrip v3 files from the original repo
  ├── hyperspace/     <- Complete, verified Hyperspace v4 files (index.html, js/, etc.)
  └── digit/          <- Complete, verified nomad_digit.html
```

### Golden Rules of Ground Truth:
1. **Zero Modification**: Never edit, refactor, or delete files inside `/ground_truth/`. They serve as permanent, runnable benchmarks.
2. **Side-by-Side Verification**: Developers can open `/ground_truth/digit/nomad_digit.html` or `/ground_truth/hyperspace/index.html` in a separate browser tab to verify that the unified version matches fonts, paddings, colors, and behaviors down to the exact pixel.
3. **Code Transplantation**: When building the unified cockpits, the assistant will copy exact HTML structures and CSS directly from `/ground_truth/` rather than reinventing or approximating them.

---

## 3. The Shared Avionics Core ("The Brain")

All three cockpits will feed from a single central module (e.g. `/js/core-telemetry.js` or `NomadAvionics`). This eliminates code duplication and ensures that every accuracy fix applies universally.

### Core Specifications to Retain:
1. **Multi-Stage GNSS Watcher with Graceful Degradation**:
   * Fast parallel IP fallback timer (1500ms) using GeoJS / BigDataCloud.
   * High-accuracy single-shot fix (`getCurrentPosition` with `enableHighAccuracy: true, timeout: 6000`).
   * Real-time `watchPosition` that gracefully degrades from high accuracy (`timeout: 10000`) to standard accuracy (`timeout: 20000`) if the device or desktop times out, preventing the display from freezing on `"SEEKING SIGNAL..."`.
   * Real GPS lock lock-guard: coarse IP estimates never overwrite high-precision satellite data once acquired.
2. **Stationary Noise Filter & Zero-Clamp Deadband (< 1.8 MPH)**:
   * Direct Doppler velocity parsing from `coords.speed`.
   * When `coords.speed` is null, synthetic velocity is only calculated if displacement exceeds the GPS accuracy radius (`Math.max(7.0, accuracy * 0.75)` and `dt >= 1.0s`).
   * Hard clamp: any velocity under **1.8 MPH (0.804 m/s)** or under **2.5 MPH** with poor accuracy (> 20m) is clamped strictly to **0.0 MPH (`STOPPED`)**.
   * Spurious position jitter while stationary never spins the heading.
3. **Sensor Fusion & 3D Tilt-Compensated Magnetometer**:
   * **In Motion (> 2.5 MPH)**: Heading driven by true GNSS ground track course (`coords.heading`), tagged as `GNSS COURSE`.
   * **Stationary (≤ 2.5 MPH)**: Smoothly fuses with device hardware compass (`DeviceOrientationEvent`). Supports iOS Safari `webkitCompassHeading` and W3C standard with full 3D tilt compensation (`pitch/roll/yaw`) and screen orientation angle offsets.
   * Includes touch permission handshake for iOS (`DeviceOrientationEvent.requestPermission()`).
4. **AASHTO Highway Corridor Grid Axis Engine (`getHighwayCorridorAxis`)**:
   * Odd-numbered Interstates & N-S state routes locked strictly to `North` or `South`.
   * Even-numbered Interstates & E-W turnpikes locked strictly to `East` or `West`.
   * Integrated **$\pm 15^\circ$ directional hysteresis deadband** around quadrant boundaries so curving highways don't jitter back and forth.
5. **Throttled Reverse Geocoding & Address Standardization**:
   * Spatial threshold (> 40 meters) and temporal cache (> 10 seconds) to prevent API rate limits.
   * Standard abbreviations (Street &rarr; St., Avenue &rarr; Ave., etc.) and 50-state abbreviation lookup.
   * Highway corridor directions automatically appended to route headers (e.g. `I-95 North`).
6. **Atmospheric & Weather Engine**:
   * Open-Meteo hyper-local weather cached on a 10-minute cycle.
   * Temperature (°F/°C), relative humidity, UV index, and barometric pressure (inHg/hPa) with trend tracking.
7. **AV & System Keep-Alive**:
   * Continuous Screen Wake Lock (`navigator.wakeLock`) so screens don't sleep in car mounts.
   * Web Audio API synthesized avionics sounds (confirmations, horn, alarms) with A2DP Bluetooth link pre-warming.

---

## 4. Shared Sensory Consoles & Arcade Screensavers

The interactive visualizers will be maintained as a shared library (`/js/kinetic-console.js`) accessible from any of the three cockpits:
* **Synthomatic**: 1:1 square aspect ratio PCB console with central `SYNTH-DSP 8800` hero chip, 16.000 MHz quartz crystal, 24C512 Sound ROM, gold traces, and regenerative braking energy discharge.
* **Starfield**: Retro warp starfield animation.
* **Underwater Ocean**: Organic procedural aquarium/tank simulation.
* **Stampede**: Kinetic particle runner.
* **Die Fidget & 60s Auto-Cycle**: Manual tapping stays white on face 5; 700ms long-press activates yellow auto-cycle that counts down from 6 &rarr; 1 every 10s with 9th-second snap spin.

---

## 5. Cockpit Switcher & UI Selector Design

### A. Startup Boot Chooser
On initial launch (or if no preference is saved), the app presents a sleek, glassy modal:
```text
┌─────────────────────────────────────────────────────────┐
│              NOMAD COCKPIT INITIALIZATION               │
│               Choose Your Driving View                  │
│                                                         │
│  [ 🚗 NOMAD ROAD TRIP ]                                  │
│    Classic structured HUD, speed sign pod & gauges      │
│                                                         │
│  [ 🚀 NOMAD HYPERSPACE ]                                 │
│    Edge-to-edge vector map & kinetic floating bubbles   │
│                                                         │
│  [ 📟 NOMAD DIGIT ]                                      │
│    Text-only 5-block rectangular avionics stack         │
│                                                         │
│  [✓] Remember my choice (can be changed anytime)        │
└─────────────────────────────────────────────────────────┘
```

### B. Instant On-The-Fly Mode Switcher
* Located in the top header (e.g. tapping the `NOMAD` brand badge or mode pill).
* Tapping immediately reveals a compact switcher allowing the driver to change views instantly.
* **Zero Reload Guarantee**: The switch is a pure DOM view toggle. The GPS engine, satellite connection, and route tracking **never pause or disconnect**.

---

## 6. Phased Implementation Roadmap (For the New Project)

When the new project is started, follow these exact phases in order:

* **Phase 0: Ground Truth Verification**
  * Confirm that `/ground_truth/roadtrip/`, `/ground_truth/hyperspace/`, and `/ground_truth/digit/` are populated and runnable.
  * Stop and discuss with the user to confirm consensus before writing code.
* **Phase 1: Shared Core Avionics Engine**
  * Create `/js/avionics-core.js` containing the pure telemetry engine (GPS, deadband, sensor fusion, corridor, geocoding, weather).
  * Validate output events against live browser feeds.
* **Phase 2: Master Shell & Cockpit Switcher**
  * Build root `/index.html` with the startup boot modal and top-bar mode switcher.
  * Test instant view switching with placeholder cards.
* **Phase 3: Transplant DIGIT**
  * Lift the exact 5-block markup and CSS from `/ground_truth/digit/nomad_digit.html`.
  * Wire each block to `avionics-core.js`. Verify side-by-side with benchmark.
* **Phase 4: Transplant Hyperspace**
  * Bring over `/js/kinetic-bubbles.js`, `/js/vehicle-safezone.js`, and the MapLibre GL map viewport from `/ground_truth/hyperspace/`.
  * Connect kinetic telemetry feeds to `avionics-core.js`. Verify side-by-side.
* **Phase 5: Transplant RoadTrip**
  * Bring over the classic HUD pods, speed sign container, and compass rose from `/ground_truth/roadtrip/`.
  * Wire to `avionics-core.js`. Verify side-by-side.
* **Phase 6: Sensory Consoles & PWA Finalization**
  * Integrate `/js/kinetic-console.js` (Synthomatic, Starfield, Die Fidget).
  * Register Service Worker (`sw.js`), Web App Manifest (`manifest.json`), and offline asset caching.
  * Update `version.js` with US Eastern Time formatting (`v[X].[MMDDYYYY].[HHMM]`).

---

## 7. Branding & Version Registry Directives

* **Central Registry**: Maintained in `/version.js`.
* **Creator Credits**: BostonyFX ([@neurocosm](https://www.instagram.com/neurocosm)).
* **Timezone Rule**: Build timestamps strictly follow 24-hour **US Eastern Time** (ET: UTC-4/UTC-5): `v[X].[MMDDYYYY].[HHMM]`.
* **DOM Merge Tags**: Support `[merge_visionary]`, `[merge_creator]`, `[merge_footer]`, and `[merge_version]`.

---

*This document is the official architectural charter for the NOMAD Unified Suite. When starting the new project, read this file in full, verify the ground truth archives, and discuss the plan with BostonyFX before writing any code.*
