# NOMAD Project Directives & Guidelines

## Core Operating Discipline: One Step at a Time
1. **Single-Step Execution**: Address one feature or fix at a time. Test and verify completely before touching secondary systems.
2. **Never Stack Unverified Edits**: Always validate vector map layers, styles, and kinetic engine canvases against strict runtime specifications.
3. **Triple-Check Work**: Verify styles for missing or mismatched paint properties (e.g. `fill-color` on lines, `line-color` on symbols, `background-color` on rasters) before deploying.
4. **Preserve PWA & Navigation Foundations**: Core HUD navigation, speed signs, compass, and vector map viewports must always remain responsive and functional.
5. **Version Registry Timezone Rule (US Eastern Time / ET)**: When updating `NOMAD_VERSION` in `version.js`, the timestamp MUST strictly reflect US Eastern Time (ET: EDT/EST, UTC-4/UTC-5) as the user's local time, NOT Pacific container/sandbox time. Format: `v4.[MMDDYYYY].[HHMM]` in 24-hour Eastern Time.

---

## Workspace Structure
- `/nomad_v3/`: Standalone, complete archive of NOMAD Road Trip Version 3 Final.
- `/` (Root): Active workspace for NOMAD Version 4 - Hyperspace.
- `Nomad version 4 - hyperspace.txt`: Design directives and conceptual backlog for Version 4.

---

## NOMAD Version 4: Hyperspace Roadmap & Concepts
- **Hyperspace Kinetic Data Bubbles & Geometry**: Floating, bouncing data bubbles/shapes (circle, egg/oval, triangle, square, squirkle, pentagon, sextagon, septagon, octagon) displaying telemetry data with customizable kinetic physics, speed, trajectory, size, and transparency.
- **Stationary vs Kinetic Mode**: Long-press on data bubbles to configure shape, color, border/edge color, transparency, and pin/place on map grid or release into kinetic bounce.
- **Safe Zone Bubble**: Dedicated protective boundary around the Chevron / Galaga Fighter so data elements bounce off without obscuring vehicle navigation.
- **Dynamic Address Gradients & Split Views**: Reversible gradient styling, top/bottom address placement toggle, and landscape split-screen modes.

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

---

## NOMAD Version 4: Hyperspace Active Milestones

### v4 Step 1: Full-Screen Map Viewport & Vehicle Safe Zone Bubble [COMPLETED & VERIFIED]
- **Status**: Completed & Verified.
- **Achievements**:
  - **Full-Screen Viewport**: Expanded `.dashboard` and `#map-card` to full viewport bleed (`100vw`, `100dvh`), eliminating old grid rows and border restrictions for an immersive edge-to-edge vector map.
  - **Light & Dark Navigation Themes Preserved**: Natural Dark Navigation and Natural Light Navigation vector tiles remain instantly toggleable with smooth MapLibre GL transitions.
  - **Vehicle Overlay & 3D Perspective Tilt**: Centered vehicle Chevron and Galaga fighter remain properly aligned at `top: 72%` with 3D road perspective tilt (`rotateX(42deg)`) in driving mode, and `top: 50%` (`rotateX(0deg)`) in 2D North-Up mode. Dixie horn audio on tap and Galaga Easter egg on long-press fully intact.
  - **Hyperspace Safe Zone Bubble**: Implemented the vehicle's protective forcefield bubble (`#vehicle-safe-zone`) around the Chevron/Fighter with soft holographic cyan pulse ring in standard mode and neon magenta/cyan shield in Galaga mode. Exposes `window.getNomadVehicleSafeZone()` for Step 2's kinetic collision engine.
  - **Screen Rotation & Resizing**: Integrated dynamic `window.addEventListener('resize')` dispatching `map.resize()` to keep tiles razor sharp across orientation changes and window resizes.
  - **HUD Overlays Streamlined for Kinetic Bubbles**: Cleared fixed telemetry gauge, tactical compass, and dice corner pods into dormant state to make room for Hyperspace kinetic data bubbles, while preserving underlying logic and event models without errors.
  - **Hardware Fullscreen Kept**: Maintained the top-center fullscreen toggle with safe-area inset protection, triggering native browser `requestFullscreen()` across compatible devices.

### v4 Step 2: Location Channel Space Block [COMPLETED & VERIFIED]
- **Status**: Completed & Verified.
- **Achievements**:
  - **Bottom-Docked Atmospheric Plaque**: Positioned the Location Channel Space Block docked along the bottom of the display (`.dock-bottom`) with dynamic backdrop blur and safe-area inset preservation.
  - **Refined Data Singularity**: Stripped the location block down strictly to Street/Highway (`#street-name`), City & State (`#city-state`), and County & Zip Code (`#county-zip`) with a subtle cyan dot divider (`#loc-divider`).
  - **Kinetic Vault Preservation**: Preserved elevation and lat/lon in an active DOM vault (`.hidden-telemetry-vault`), keeping real-time GPS telemetry updates alive for future kinetic data bubble attachment without UI clutter.
  - **High-Contrast Theme Adaptation**: Implemented smooth gradient backgrounds for both Natural Dark Navigation (semi-transparent cockpit fade to deep black) and Natural Light Navigation (frosted off-white fade to slate), ensuring street names and sub-labels are effortlessly legible in all lighting conditions.
  - **Responsive Corner Button Clearance**: Adjusted horizontal padding and auto-shrink logic to preserve touch targets and avoid collision with the bottom-left map theme toggle shield.
  - **Centered Interactive Toast**: Updated the tap-to-copy Google Maps link toast to float above the bottom plaque with a high-contrast green pill badge.

### v4 Step 3: Minimal Top Corners & Glassy Location Pill [COMPLETED & VERIFIED]
- **Status**: Completed & Verified.
- **Achievements**:
  - **1px Glassy Location Pill**: Refined the floating location pill border to a razor-sharp `1px solid #ff7700` and increased semi-transparency (`rgba(8, 14, 26, 0.44)` with `12px blur` in dark mode; `rgba(255, 255, 255, 0.52)` in light mode), allowing vector map features, roads, and topography to show elegantly underneath.
  - **Deep Top Corner Minimal Buttons**: Relocated accessory buttons away from the location pill into the deep top corners of the screen as ultra-minimalist controls:
    - **Top-Left (Map Theme)**: Pure minimal map icon button (`#interstate-badge-container`, 36px circular glass pod) toggling Natural Dark and Natural Light map styles with zero label clutter.
    - **Top-Right (Perspective Mode)**: Pure minimal small chevron button (`#pill-perspective-btn`, 36px circular glass pod) cycling between 3D Take-Off Drive (58° pitch) and Top-Down Centered / Track-Up perspectives.
  - **Vehicle Chevron Repurposed for Perspective Switching**: Tapping the vehicle Chevron marker (`#vehicle-overlay`) directly triggers `cyclePerspectiveMode()`, toggling between Top-Down and 3D Take-Off perspectives with smooth camera tilt transitions and visual toast feedback. Removed previous horn audio on tap to dedicate the chevron to perspective control.
  - **Clean Floating Location Plaque**: Removed the top-deck container from above the location pill, centering the "COPIED!" toast feedback directly within the pill for a unified, distraction-free cockpit view.

### v4 Step 4: Elevated Vehicle Position & Sleek Unbolded Location Pill [COMPLETED & VERIFIED]
- **Status**: Completed & Verified.
- **Achievements**:
  - **Elevated Chevron & Safe Zone Circle (+10%)**: Shifted the vehicle Chevron overlay and its protective holographic Safe Zone Bubble up by 10% from `top: 72%` to `top: 62%` in driving perspective mode. Aligned MapLibre camera top padding (`containerHeight * 0.24`) and `window.getNomadVehicleSafeZone` coordinate mapping so the vehicle sits comfortably higher above the bottom location channel block.
  - **Unbolded Clean Typography**: Changed `.street-value` font-weight from 700 to 400 (regular weight) with refined letter-spacing (`0.01em`) and scaled down `clamp(1.2rem, 3.8vw, 1.85rem)`, creating an airy, sophisticated appearance.
  - **Compact Low-Profile Pill Frame**: Reduced vertical padding to `6px 16px 7px 16px` and border-radius to `18px`, making the location plaque noticeably less tall while maintaining clear legibility.

### v4 Step 5: Glassy Top Toggles & Dedicated Galaga Fighter Toggle [COMPLETED & VERIFIED]
- **Status**: Completed & Verified.
- **Achievements**:
  - **Glassy Top Controls Personality**: Unified all 3 top-docked circular toggles (Top-Left Map Theme, Top-Center Fullscreen, Top-Right Fighter) with matching glassy semi-transparent circles (`36px`, `rgba(8, 14, 26, 0.44)`, `12px blur`, 1px cyan border in dark mode; `rgba(255, 255, 255, 0.52)` in light mode).
  - **Top-Right Repurposed for Fighter Mode**: Dedicated the top-right button (`#fighter-toggle-btn`) to toggling between standard Cruise Chevron and retro Galaga Fighter vehicle modes, featuring an authentic mini 8-bit Galaga Fighter vector icon.
  - **Galaga Active State & Toast**: In Galaga Fighter mode, the top-right button glows with neon magenta/cyan accents (`.active-fighter`). Tapping immediately triggers arcade audio, updates the vehicle and safe zone bubble, and displays visual toast confirmation ("Galaga Fighter Active" / "Cruise Chevron Active").
  - **Center Chevron Perspective Singularity**: Dedicated the center vehicle Chevron (`#vehicle-overlay`) as the primary control for camera perspective transitions (Top-Down Centered, Top-Down Track-Up, and 3D Take-Off Drive).

### v4 Step 6: Dynamic "Other Option" Vehicle Toggle & Full-Scale Galaga Presence [COMPLETED & VERIFIED]
- **Status**: Completed & Verified.
- **Achievements**:
  - **Dynamic "Other Option" Icon Switching**: The top-right toggle button now dynamically displays the destination/alternate vehicle mode. When the vehicle is in **Cruise Chevron** mode, the top-right button displays the **Galaga Fighter** icon ("Switch to Galaga Fighter"). When in **Galaga Fighter** mode, the button flips to display the crisp **Cruise Chevron** icon ("Switch to Cruise Chevron").
  - **Full-Scale Galaga Fighter Presence**: Scaled up the on-map Galaga Fighter overlay from `52px` to `64px` (container `68px`), giving it the same commanding optical presence, width, and bold road visibility as the Chevron, with balanced drop shadows and laser pulse animation.

### v4 Step 7: Hero Kinetic Speed Bubble Prototype & Control Panel [COMPLETED & VERIFIED]
- **Status**: Completed & Verified.
- **Achievements**:
  - **Kinetic Speed Telemetry Bubble**: Created the hero floating speed telemetry bubble (`#speed-bubble`) with live GPS speed display, auto-switching units (MPH / KM/H), and glass transparency.
  - **2D Boundary & Safe Zone Deflection Physics**: Implemented a continuous kinetic physics loop (`requestAnimationFrame`) with perimeter wall deflection and real-time elastic collision against the vehicle's protective holographic forcefield (`window.getNomadVehicleSafeZone()`), ensuring telemetry never obscures the Chevron or Galaga Fighter.
  - **Direct Pointer Drag & Kinetic Flicking**: Added smooth mouse and single-touch dragging with inertia velocity transfer when released.
  - **Long-Press Control Panel (700ms)**: Long-pressing the bubble opens the dedicated Hyperspace Configuration Modal with haptic feedback:
    - **Movement Modes**: Toggle between **🚀 Kinetic Bounce** (floating physics) and **📌 Stationary Pinned** (drag anywhere and lock in place).
    - **Geometric Shapes**: Circle, Egg, Squirkle, Square, Triangle, Pentagon, Hexagon, and Octagon.
    - **Palette Swatches**: Cyan (`#00d4ff`), Gold (`#ffb703`), Hot Pink (`#ff0055`), Neon Green (`#30d158`), Violet (`#bf5af2`), Ice White (`#ffffff`), and Sunset Orange (`#ff7700`).
    - **Dimension & Transparency Sliders**: Live adjustment of size (80px–150px) with proportional font scaling, background opacity (15% sheer to 100% solid), and drift speed (1: Gentle to 5: Hyper).
    - **LocalStorage Persistence**: Saves shape, color, opacity, size, velocity, and pin coordinates across reloads.

### Post-v4 Wishlist / Deferred
- **Map Feature Legend & POI Essential Services Filter**: Deferred until after Version 4. Since NOMAD functions as a telemetry and kinetic road-trip HUD rather than a turn-by-turn POI directory, POI clutter filtering will be revisited in future phases.
