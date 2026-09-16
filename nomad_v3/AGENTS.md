# NOMAD Project Directives & Guidelines

## Core Operating Discipline: One Step at a Time
1. **Single-Step Execution**: Address one feature or fix at a time. Test and verify completely before touching secondary systems.
2. **Never Stack Unverified Edits**: Always validate vector map layers, styles, and kinetic engine canvases against strict runtime specifications.
3. **Triple-Check Work**: Verify styles for missing or mismatched paint properties (e.g. `fill-color` on lines, `line-color` on symbols, `background-color` on rasters) before deploying.
4. **Preserve PWA & Navigation Foundations**: Core HUD navigation, speed signs, compass, and vector map viewports must always remain responsive and functional.
5. **Version Registry Timezone Rule (US Eastern Time / ET)**: When updating `NOMAD_VERSION` in `version.js`, the timestamp MUST strictly reflect US Eastern Time (ET: EDT/EST, UTC-4/UTC-5) as the user's local time, NOT Pacific container/sandbox time. Format: `v3.[MMDDYYYY].[HHMM]` in 24-hour Eastern Time.

---

## Active Evening Projects & Roadmap Registry

### Step 3: Vehicle Chevron & Galaga Fighter 3D Perspective Tilt [COMPLETED]
- **Status**: Completed & Verified.
- **Achievements**:
  - Pitch alignment in 3D Perspective Mode: Applied complementary 3D CSS transform (`perspective(600px) rotateX(42deg) rotate(...)`) to the center vehicle Chevron and Galaga fighter so they lie along the plane of the angled road (pitch: 58°).
  - Flat alignment in 2D Mode: Smooth reset to flat overhead rendering (`perspective(600px) rotateX(0deg)`) in 2D Overview Track and North-Up modes.
  - Seamless 0.35s cubic-bezier transform animation when transitioning camera modes or toggling Galaga fighter mode.

### Step 4: Vehicle Horn Audio (Chevron Horn & Galaga Laser) [COMPLETED]
- **Status**: Completed & Verified.
- **Achievements**:
  - Restored clean, standard Web Audio routing with zero echo or duplicate triggers.
  - Kept hardware A2DP link pre-warming and sub-audible keep-alive for zero-latency Bluetooth/system audio responsiveness.
  - Placed experimental silent-switch speaker redirection on future wishlist to ensure 100% stable single-trigger playback.

### Step 5: Synthomatic Console Redesign & Engine Stability [COMPLETED & VERIFIED]
- **Status**: Completed & Verified.
- **Achievements**:
  - **1:1 Square Aspect Ratio**: Re-anchored the Synthomatic PCB canvas and coordinate space to `Math.min(w, h) * 0.90` so the board stays a crisp, non-distorted square centered inside the map viewport.
  - **Clean 3-Component Layout**: Stripped micro-component clutter down to the central hero `SYNTH-DSP 8800` chip flanked by 2 iconic secondary components: the `16.000 MHz` brushed aluminum Quartz Crystal Oscillator and the `24C512` SOIC-8 Sound ROM.
  - **Streamlined Geometric Buses**: Cleaned up erratic wiring into 8 balanced, 45-degree chamfered gold/copper/cyan traces connecting the central DSP to the crystal clock, ROM bus, and stereo audio DAC outputs.
  - **Precision Mounting Pads**: Replaced cluttered test points with 4 corner gold annular mounting pads with metallic specular glints and central drill holes.
  - **Smooth Kinetic Flow**: Replaced 22 random points with 8 rhythmic glowing data packets pulsing down active hero traces, with central DSP energy discharge upon regenerative braking.
  - **Circuit Crash Bug Fixed**: Fixed lexical declaration order of `boxW` before regenerative braking pulse surge; wrapped the kinetic loop in `try...catch...finally` so the animation loop can never permanently terminate.
  - **Instant Screen Swapping & Blank Prevention**: Removed redundant `map.setStyle()` calls on theme return so cached vector tiles and WebGL pipelines stay in GPU memory; added `visibilitychange` and `focus` wake-up hooks so returning from Notes never blanks the viewport.
  - **Stationary Speedometer Deadband**: Added hard zero-clamp filter for indoor GPS multipath drift and phone shaking (< 1.8 MPH), locking speed strictly to 0 MPH when stationary.

### Step 6: Die Fidget Navigation & 60s Auto-Cycle Countdown [COMPLETED & VERIFIED]
- **Status**: Completed & Verified.
- **Achievements**:
  - **Manual Scrolling Die Rule (White Face 5)**: When manually tapping through kinetic fidget consoles, the Die strictly remains crisp WHITE (`#ffffff`) and displays face 5 (`currentDieFace = 5`). It never counts up or shifts faces on single taps.
  - **Active State Color Isolation**: Removed `:active` yellow styling for non-auto-cycling states across standard and starfield modes so the die never flashes yellow during momentary manual taps.
  - **Long-Press Auto-Cycle Activation (700ms)**: Only upon a deliberate 700ms long-press does the Die turn vibrant yellow/gold (`#ffb703`, `.auto-cycling`) and begin the automated screensaver cycle.
  - **60-Second Countdown (6 → 5 → 4 → 3 → 2 → 1)**: In auto-cycling mode, the Die starts on face 6. Every 10 seconds, it snap-spins and steps down (6 → 5 → 4 → 3 → 2 → 1). At second 60, right as face 1 completes, it transitions to the next kinetic fidget console (Starfield → Underwater Ocean → Synthomatic → Stampede), resets the die back to 6, and repeats the 60-second cycle.
  - **9th-Second Snap Spin Synchronizer**: Die spin triggers right on the 9th second of each 10s step (seconds 9, 19, 29, 39, 49, 59). At 420ms into the 0.85s snap spin (rotated 180° with elastic bounce), the pips smoothly morph into the next face value, landing and resting firmly on the new face right as the 10th second arrives.
  - **Immediate Pause & Reset**: Manually tapping the Die or long-pressing again immediately stops the auto-cycle timer and restores the Die back to crisp WHITE and face 5. Tapping the lower-left Map button returns to navigation and also clears auto-cycling.

### Step 7: Highway Header Conciseness & Corridor Grid Axis Direction [COMPLETED & VERIFIED]
- **Status**: Completed & Verified.
- **Achievements**:
  - **Primary Route Header Singularity**: Eliminated redundant dual-route concatenation (e.g. "I-95 / Route 128") from the location header. The header now focuses exclusively on the primary route (e.g. `I-95 South`), keeping the typography clean, uncluttered, and legible at a glance.
  - **Concurrent Route Shield Delegation**: Secondary concurrent routes (such as Massachusetts Route 128) continue to be rendered cleanly on their dedicated map shields (`route-badge-container`), preserving dual-route visibility without header text bloat.
  - **Corridor Grid Axis Logic (`getHighwayCorridorAxis`)**: Replaced raw unconstrained 4-quadrant heading mapping with highway grid axis awareness:
    - Odd-numbered Interstates (e.g. I-95, I-93) and officially designated North-South state routes (e.g. Route 128) are constrained to `North` or `South`.
    - Even-numbered Interstates (e.g. I-90 Mass Pike, I-84) are constrained to `East` or `West`.
    - Includes a ±15° directional hysteresis deadband preventing jitter or false West/East readings along physical curves in circumferential highway arcs (such as I-95 through Lexington and Burlington).
    - Map shield direction dots (I-95 white dot, Route 128 black dot) are synchronized to the same corridor axis.

### Step 8: Weather Cockpit Typography & Atmospheric Scaling [COMPLETED & VERIFIED]
- **Status**: Completed & Verified.
- **Achievements**:
  - **Atmospheric Stats Floor Boost (+11%)**: Upgraded `.weather-details-stacked` and `.pressure-pill` from `clamp(0.92rem, 2.8vw, 1.15rem)` to `clamp(1.02rem, 3.2vw, 1.25rem)`. Eliminates smartphone bottom-out floor clamping on 412px viewports (Pixel 11 Pro), raising rendered font from ~14.7px to ~16.3px for crisp arm's-length legibility.
  - **Proportional Atmospheric Icons (20px)**: Scaled humidity droplet, UV index sun, and barometric gauge SVGs from 18px to 20px (both static markup and dynamic JavaScript DOM updates) with dedicated flex-shrink preservation.
  - **Hero Temperature Elevation (+5%)**: Increased `.weather-temp` from `clamp(2.1rem, 6.6vh, 3.1rem)` to `clamp(2.25rem, 7.0vh, 3.3rem)`, giving the temperature number better visual equilibrium alongside the massive speed sign digits.
  - **Weather Description Harmony**: Scaled `.weather-desc-container` slightly to `clamp(0.95rem, 3.0vw, 1.18rem)` with balanced spacing (`gap: clamp(3px, 0.7vh, 6px)`).

### Post-v4 Wishlist / Deferred
- **Map Feature Legend & POI Essential Services Filter**: Deferred until after Version 4. Since NOMAD functions as a telemetry and kinetic road-trip HUD rather than a turn-by-turn POI directory, POI clutter filtering will be revisited in future phases.
