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

### v4 Step 8: Kinetic Bubble Hover Catch, 3 Preset Sizes & Safe Zone Behavior [COMPLETED & VERIFIED]
- **Status**: Completed & Verified.
- **Achievements**:
  - **Immediate Stop on Hover ("Catch the Bubble")**: The kinetic physics loop checks `isHovered` and halts immediately when the cursor hovers or a finger makes contact, completely eliminating the frustration of having to chase the moving bubble.
  - **Visual Feedback on Hover & Long Press**: Added an unmistakable cyan glow highlight upon hover, subtle compression scaling with cyan resonance during a 600ms long press, and gentle haptic vibration upon modal reveal.
  - **Vehicle Safe Zone Options (Bounce Off vs. Pass Underneath)**: Added a dedicated toggle in the configuration modal:
    - **Bounce Off (Default)**: Telemetry bubble elastically deflects off the vehicle's protective forcefield bubble (`window.getNomadVehicleSafeZone()`).
    - **Pass Underneath**: Skips vehicle collision calculation and glides smoothly beneath the Chevron (z:20) and bottom location block (z:30), perfectly mimicking the location plaque pass-underneath behavior.
  - **3 Quick-Select Preset Dimensions**: Integrated a 3-button segmented selector (`Compact 80px`, `Standard 104px`, `Hero 140px`) synchronized seamlessly with the granular size slider and live font scaling.
  - **Repositioning & Full Preset Persistence**: Preserved direct drag repositioning and full state persistence in `localStorage`.

### v4 Step 9: Stealth Fighter Theme Adaptation & Kinetic Shape Dynamic Spin [COMPLETED & VERIFIED]
- **Status**: Completed & Verified.
- **Achievements**:
  - **F-117 Stealth Fighter Light GPS Palette**: Transformed the retro Galaga Fighter in Light Navigation mode into a striking matte charcoal and stealth slate interceptor (`#1e293b`, `#334155`, `#475569`) with high-contrast road visibility, automatically switching back to vibrant arcade neon (`#ff0055`, `#ffe600`, `#00d4ff`) in Dark GPS mode.
  - **Theme Switcher Synchronization**: Hooked `renderGalagaFighterSVG` directly into `applyThemeByIndex` and `toggleGalagaMode` for instantaneous color palette transitions when toggling map styles.
  - **Upright Data with Dynamic Shape Rotation**: Decoupled the outer geometric shape from inner telemetry content using a dedicated rotation frame (`#speed-bubble-shape-frame`), keeping speed digits, unit labels, and dots locked strictly upright while the outer boundary rotates.
  - **Live GPS Speed & Gyro Spin Modes**:
    - **Speed Spin (`gps`)**: Outer shape rotation rate scales dynamically with live vehicle speed (subtle 0.2° idle drift at 0 MPH up to rapid 3.2°/frame rotation at highway speeds).
    - **Compass/Gyro Orientation (`gyro`)**: Outer shape aligns directly with the vehicle's compass bearing / gyroscope heading.
    - **Static Shape (`off`)**: Resets outer boundary cleanly to 0° rotation.
  - **Granular Rotation Intensity Slider**: Added a 5-step rate multiplier slider (0.5x Subtle, 1.0x Normal, 1.5x Brisk, 2.0x Rapid, 3.0x Warp) in the modal with full state persistence.

### v4 Step 10: Crystal Transparent Data Bubbles & Bounding Box Elimination [COMPLETED & VERIFIED]
- **Status**: Completed & Verified.
- **Achievements**:
  - **Square Bounding Box & Artifact Eradication**: Stripped away all legacy rectangular box-shadows and unclipped `backdrop-filter: blur(12px)` that caused visible square artifacts and blurred tiles outside complex shapes (such as eggs and polygons). Enforced strict `background: transparent !important; border: none !important; box-shadow: none !important;` on the outer `#speed-bubble` anchor.
  - **Contour-Conforming Dynamic Glow**: Replaced rectangular box-shadow with alpha-channel `filter: drop-shadow(...)` on both the rotating geometric shape frame and hover/dragging states, guaranteeing all glows conform strictly to the egg, circle, or polygon contour with 100% transparent corners.
  - **Crystalline Transparent Glass Background**: Replaced dark opaque fill with sheer, see-through glass tint (`18% Sheer Glass` default) that dynamically adapts to both Dark GPS mode (`rgba(8, 14, 26, alpha)`) and Light GPS mode (`rgba(255, 255, 255, alpha)`), allowing vector map roads, street names, and topography to shine through with razor-sharp clarity.
  - **Granular 0% to 80% Transparency Range**: Upgraded the configuration slider to start at `0% Crystal Clear` (100% see-through border-only mode) through `18% Sheer Glass` to `80% Frosted Tint` with descriptive live badges. Automatically upgrades returning users from legacy opaque 44% to sheer 18% glass.
  - **High-Contrast Upright Telemetry**: Enhanced `.kinetic-bubble-inner` with deep multi-stop text shadow (`rgba(0, 0, 0, 0.95)`), ensuring speed digits and units pop with effortless legibility over transparent moving map scenery.

### v4 Step 11: 100% Vector Geometric Edges on All Shapes (Polygon Edge Restoration) [COMPLETED & VERIFIED]
- **Status**: Completed & Verified.
- **Achievements**:
  - **Complete Edges on All Geometric Shapes**: Replaced CSS `clip-path` (which severed diagonal borders and left only isolated fragments visible on polygons) with native precision SVG vector paths and polygons (`<circle>`, `<path>` egg, `<rect>` squirkle/square, and `<polygon>` triangle, pentagon, hexagon, octagon).
  - **Continuous Closed Perimeter**: Every side of every shape now renders a full, uninterrupted 2.5px stroke with `stroke-linejoin="round"`, ensuring all 6 edges of the hexagon, 8 edges of the octagon, 5 edges of the pentagon, and 3 edges of the triangle are bold, fully visible, and glowing.
  - **Theme & Swatch Reactive Glows**: Dynamic color coordination (`--bubble-accent`) synchronizes both the border strokes and multi-stop drop-shadow glows directly with the user's selected swatch (Cyan, Hot Pink, Gold, Neon Green, Violet, Ice White, Sunset Orange), ensuring hover halos and resting glows follow the exact shape contour in the chosen color.
  - **Shape Picker Wireframe Previews**: Upgraded the modal geometric shape grid with mini SVG wireframe icons on each button, giving the user a clear preview of every shape's complete closed perimeter.
  - **Optical Centroid Alignment**: Fine-tuned vertical text offsets for triangle and pentagon so telemetry digits remain centered within each shape's unique geometry.

### v4 Step 12: Autonomous PWA Architecture, Version Visibility & Polygon Text Rules [COMPLETED & VERIFIED]
- **Status**: Completed & Verified.
- **Achievements**:
  - **Zero Dependencies on Archive (nomad_v3)**: Audited root workspace to eliminate all links and dependencies on `/nomad_v3/`. Copied visualizer arcade and sub-pages (`visualizer.html`, `disco.html`, `festival.html`, `slamdance.html`, `seasons.html`, `kitt.html`, `gps-setup.html`) directly into root, decoupling NOMAD Version 4 completely.
  - **PWA Installability Standards**: Upgraded `manifest.json` with explicit `id: "./"`, `scope: "./"`, and `display: "standalone"`. Implemented `beforeinstallprompt` and `appinstalled` listeners in `index.html` with a dedicated in-app install button (`#modal-pwa-install-btn`). Updated service worker cache to `nomad-hyperspace-v4-09162026-pwa`.
  - **Location Channel Long-Press Version Pop-up**: Enhanced the About modal (`openAboutModal()`) with a prominent, luminous cyan `SYSTEM FIRMWARE` banner displaying the exact version (`window.NOMAD_VERSION`), updated modal titles to `NOMAD: Hyperspace ↗`, and synchronized all version tags on long-press.
  - **Shape Background Opacity Persistence**: Verified that background opacity (0% Crystal Clear to 80% Frosted Tint) dynamically adjusts the vector `fill` of all 8 shapes; bound `saveBubbleConfig()` directly to opacity, size, and speed sliders so all adjustments persist immediately to `localStorage`.
  - **Polygon Text Rules & Geometric Spatial Analysis**: Formulated mathematical rules for typography inside rotating and constrained polygons (incircle containment, true geometric center of mass vs. bounding box center, and dynamic vertical stacking) to eliminate edge overflow.

### v4 Step 13: Structural Boundary Polygons & Integrated Telemetry Keystones [COMPLETED & VERIFIED]
- **Status**: Completed & Verified.
- **Achievements**:
  - **Structural Boundary Architecture**: Transformed polygon and shape perimeters into structural chassis where the channel name (`SPEED`) is an integrated keystone of the outer perimeter rather than floating interior text.
  - **Precision Base Notches Across All 8 Shapes**: Refactored `getBubbleShapeSVGMarkup` to carve optical notches into the baseline of every geometry (Triangle, Square, Squirkle, Hexagon, Octagon, Pentagon, Circle, Egg), embedding bold typographic labels directly into the boundary path.
  - **Single Uncluttered Centered Number**: Elevated the central telemetry value into the solitary hero of `.kinetic-bubble-inner` (`font-size: 0.40 * size`, weight: 800), perfectly centered in the maximum inscribed circle.
  - **Dynamic Center of Mass vs. Rotational Centroid**: Bound `.kinetic-bubble.has-shape-triangle .kinetic-bubble-inner` to `translateY(13%)` for center of mass alignment when static, automatically transitioning to `translateY(0)` (`is-spinning`) when Speed Spin or Gyro rotation is active so the outer chassis spins symmetrically around the stationary central digit.
  - **Contour-Conforming Neon Radiance**: SVG text inherits the exact vector stroke color and multi-stop alpha drop shadow, glowing seamlessly with the physical chassis in both Natural Dark and Natural Light navigation modes.

### v4 Step 14: Sleek Unbolded Telemetry & Mathematical Centroid Alignment [COMPLETED & VERIFIED]
- **Status**: Completed & Verified.
- **Achievements**:
  - **Sleek Unbolded Telemetry Typography**: Replaced heavy `font-weight: 800` on `.kinetic-bubble-value` with refined `font-weight: 300` (light, elegant display typography) and enhanced font scaling (`0.44 * size`), giving the central digit an airy, modern, precision cockpit aesthetic.
  - **Mathematical True Centroid Alignment (50, 50)**: Recomputed the geometric vertices of all 8 shapes (including the equilateral Triangle with apex at (50,6) and base at y=72, and regular Pentagon with vertices at R=44 from (50,50)) so that every shape's true geometric centroid of mass sits precisely at (50, 50).
  - **Centering at All Rotation Angles**: Positioned `.kinetic-bubble-inner` with `position: absolute; inset: 0;` and removed arbitrary CSS `translateY` offset hacks, guaranteeing the central number remains dead-center in static mode, dynamic spin mode, and gyro orientation alike.
  - **Enlarged Structural Keystone Labels**: Scaled up perimeter chassis text (`SPEED`) by 60% from `font-size: 7.2` to `font-size: 11.5` (`letter-spacing: 2.2px`), making the structural channel name crisp and legible.
  - **Generous Dimension Presets**: Upgraded preset sizes from 80/104/140px to `Compact (90px)`, `Standard (125px)`, and `Hero (160px)` with an expanded slider range of 80px–180px, automatically upgrading legacy small bubble states.

### v4 Step 15: Zero-Bleed Structural Perimeter Calibration Across All 8 Shapes [COMPLETED & VERIFIED]
- **Status**: Completed & Verified.
- **Achievements**:
  - **Comprehensive Stroke Bleed Eradication**: Fixed the critical path overlap bug in the squirkle and polygon geometries where boundary stroke segments were drawn right across the letters of "SPEED".
  - **Proportional Label Dimensions**: Calibrated `channelLabel` to `font-size: 8.0` (`7.6` for Octagon) with `letter-spacing: 1.3px` and `dominant-baseline: central`, establishing an exact physical text span of ~27–31 SVG units.
  - **Generous Air-Gap Clearances**: Widened the open perimeter notches on all 8 shapes (Triangle, Square, Squirkle, Hexagon, Octagon, Pentagon, Circle, Egg) to a 38–40 unit gap (e.g. from $x=30$ to $x=70$), providing a minimum 3.5–4.5 unit empty safety buffer between the rounded stroke caps (`stroke-linecap="round"`) and the text.
  - **All Dimension Presets Tested**: Verified that the vector viewBox scales seamlessly across all preset dimensions (`90px Compact`, `125px Standard`, `160px Hero`) and granular slider ranges (`80px–180px`), guaranteeing the structural label is never cut off, encroached upon, or clipped during dynamic rotation.

### v4 Step 16: Cockpit Layout Inversion & Long-Press Flip Trigger [COMPLETED & VERIFIED]
- **Status**: Completed & Verified.
- **Achievements**:
  - **Long-Press Layout Inversion Trigger (700ms)**: Implemented deliberate 700ms long-press handling on the center Min/Max button (`#fullscreen-btn`), complete with multi-pulse haptic vibration (`[30, 40, 60]`) and visual confirmation toast ("Layout: Location Top • Controls Bottom" / "Layout: Location Bottom • Controls Top").
  - **Normal Tap Preservation**: Standard short taps continue to toggle browser fullscreen seamlessly without false trigger interference.
  - **Synchronized Top/Bottom Transposition**: Toggling inversion smoothly swaps the location plaque to the top deck (`top: max(12px, env(safe-area-inset-top))`) and simultaneously brings the 3 minimal controls (Map style toggle, Fullscreen/Min-Max, and Vehicle switcher) to the bottom dock (`bottom: max(16px, env(safe-area-inset-bottom))`) via 0.4s cubic-bezier animations.
  - **Adaptive 3D Camera Perspective & Map Padding**: `syncMapPadding()` dynamically shifts camera center padding to the bottom (`bottom: containerHeight * 0.24`) when inverted in 3D Take-Off mode, maintaining clear vehicle tracking along the highway.
  - **Kinetic Physics Boundary Safety**: Kinetic bubble collision engine dynamically updates wall deflection boundaries (`topLimit: 88px`, `bottomLimit: vh - 68px`), preventing floating telemetry from colliding with the relocated location block or control pods.
  - **Full Persistence Across Sessions**: Saves and restores layout configuration in `localStorage ('nomad_layout_inverted')` upon startup.

### v4 Step 17: Universal Kinetic Data Bubble Architecture & Multi-Tab Configuration Modal [COMPLETED & VERIFIED]
- **Status**: Completed & Verified.
- **Achievements**:
  - **Universal 6-Bubble Telemetry Roster**: Expanded the kinetic engine from a single speed bubble to 6 independent telemetry bubbles:
    - `speed`: Live GPS speed with unit switching (MPH/KMH).
    - `compass`: Vehicle heading bearing with degree indicator.
    - `altitude`: Real-time elevation in feet/meters.
    - `temp`: Ambient temperature with °F / °C unit toggle.
    - `atmo`: Unified atmospheric triad (Humidity %, UV Index, Barometric Pressure in/hPa) with customizable metric toggles.
    - `coords`: GPS coordinates truncated to 3 decimal places (e.g. `42.360° N`, `71.058° W`) for clean on-screen readability while preserving full precision for records.
  - **Universal Multi-Tab Configuration Modal**: Replaced single-bubble settings with a universal panel featuring 6 horizontal tabs (`SPEED`, `COMPASS`, `ALTITUDE`, `TEMP`, `ATMO`, `COORDS`). Long-pressing *any* bubble immediately opens the modal configured directly to that bubble, while allowing seamless tab switching between all telemetry elements.
  - **Atmospheric Triad Sub-Selector**: Interactive multi-select button group allowing users to choose any combination (1, 2, or all 3) of Humidity, UV, and Barometric Pressure with automatic layout balance and empty-bubble protection.
  - **Independent Geometry, Motion & Pinned States**: Each of the 6 bubbles independently retains its own geometric shape (8 choices), color accent (7 swatches), glass transparency (0%–80%), preset dimensions, rotation dynamics (Keel, Off, GPS, Gyro), and motion physics (Kinetic Bounce vs. Stationary Pinned).
  - **Generalized Physics & Interaction Engine**: Refactored pointer event bindings, collision avoidance, and hover catch logic to operate universally across all active bubbles, with unified persistence to `localStorage ('nomad_v4_bubbles')`.

### v4 Step 18: Zero Horizontal Scroll Modal Architecture & Full Dashboard Fit [COMPLETED & VERIFIED]
- **Status**: Completed & Verified.
- **Achievements**:
  - **Zero Horizontal Overflow**: Fully contained the Hyperspace configuration modal inside the viewport and dashboard container bounds with strict `overflow-x: hidden !important;`, `box-sizing: border-box;`, and dynamic `max-width: min(400px, calc(100vw - 20px))` and `width: calc(100% - 24px)`.
  - **Vertical-Only Scroll Stream**: Preserved seamless, smooth vertical scrolling (`overflow-y: auto; -webkit-overflow-scrolling: touch; max-height: calc(100dvh - 32px)`) while completely eliminating any lateral movement or horizontal scrollbars.
  - **Flexible CSS Grid Systems**: Upgraded segmented controls to fluid responsive grids (`repeat(3, minmax(0, 1fr))` for tabs, presets, and atmo triad; `repeat(2, minmax(0, 1fr))` for spin/keel dynamics; `repeat(4, minmax(0, 1fr))` for shapes) with `min-width: 0` on button children, preventing text or icon blowout on narrow mobile screens.
  - **Concise Button Labels & Compact Ticks**: Refined button copy and slider ticks (`Compact/Standard/Hero`, `0% Clear/18% Sheer/45% Frost/80% Tint`, `Keel/Off/Speed/Gyro`, `Deflect/Glide Under`, `Bounce Walls/Wrap Edge`) to fit single-line presentation without word wrapping or button clipping.

### v4 Step 19: Dedicated Modular JavaScript Architecture & Offline PWA Manifest [COMPLETED & VERIFIED]
- **Status**: Completed & Verified.
- **Achievements**:
  - **Modular Architecture Separation**: Successfully decoupled the monolithic ~7,800-line `index.html` codebase into 4 dedicated, maintainable, single-responsibility JavaScript modules in `/js/`:
    - `/js/vehicle-safezone.js`: Vehicle Chevron & Galaga Fighter SVG vector rendering, 3D perspective pitch alignment, vehicle mode switching, and forcefield boundary radius calculation (`window.getNomadVehicleSafeZone`).
    - `/js/location-bar.js`: Reverse geocoding street name abbreviations, auto-shrink typography engine, map link sharing with visual toast, and top/bottom cockpit layout inversion.
    - `/js/modals.js`: Universal modal controllers (About modal with PWA install prompts, Weather refresh settings modal, and Hyperspace configuration modal).
    - `/js/kinetic-bubbles.js`: Full 6-bubble telemetry state machine, 60fps kinetic physics loop, boundary wall deflection and edge wrap, dynamic shape frame spin engine (Keel buoyant sway, GPS speed banking, Gyro compass sync), pointer drag/flick inertia, instant hover catch, and live telemetry DOM renderers.
  - **Global State Coordination Bridge**: Implemented a lightweight, robust bridge linking modules through `window.NomadState` and shared telemetry globals, eliminating race conditions while preserving backward compatibility.
  - **Streamlined `index.html` Entry Point**: Reduced `index.html` by over 1,300 lines of complex inline logic, creating a clean, organized entry point where features can be developed and refined surgically.
  - **Offline PWA & Service Worker Cache Manifest**: Updated `sw.js` cache to `nomad-hyperspace-v4-09182026-pwa`, adding all 4 modular scripts to `ASSETS_TO_CACHE` for continuous offline PWA operation.
  - **Version Registry Updated**: Updated `window.NOMAD_VERSION` in `version.js` to `v4.09182026.0605` in strict compliance with the US Eastern Time registry mandate.

### Post-v4 Wishlist / Deferred
- **Map Feature Legend & POI Essential Services Filter**: Deferred until after Version 4. Since NOMAD functions as a telemetry and kinetic road-trip HUD rather than a turn-by-turn POI directory, POI clutter filtering will be revisited in future phases.
