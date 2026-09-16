/**
 * ====================================================================
 * NOMAD HUD & Telemetry Navigation System
 * 
 * Proprietary & Created by BostonyFX
 * Instagram: https://instagram.com/neurocosm
 * All rights reserved.
 * ====================================================================
 * 
 * Nomad Roadtrip - Kinetic Sensory Starfield & Underwater Ocean Console
 * High-Performance Decoupled Canvas & Fluid Simulation Physics Engine
 * Weather-Reactive Stellar Spectrum & Marine Caustic Particle System
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.KineticConsole = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Base Stellar Palette with Vibrant Weather Morphs
  const STAR_PALETTES = {
    warm: [
      '#ffffff', // Pure Diamond Starlight
      '#fef08a', // Brilliant Sunny Yellow
      '#fde047', // Supernova Gold
      '#fb923c', // Solar Flare Amber
      '#f43f5e', // Coronal Rose
      '#ffffff'
    ],
    temperate: [
      '#ffffff', // Diamond White
      '#38bdf8', // Electric Plasma Cyan
      '#4ade80', // Emerald Aurora
      '#fde047', // Solar Gold
      '#a855f7', // Cosmic Violet
      '#ffffff'
    ],
    cool: [
      '#ffffff', // Pure Ice Diamond
      '#38bdf8', // Glacial Cyan
      '#60a5fa', // Cobalt Star
      '#818cf8', // Deep Indigo Pulse
      '#c084fc', // Nebula Lavender
      '#ffffff'
    ]
  };

  class KineticEngine {
    constructor() {
      this.container = null;
      this.canvas = null;
      this.ctx = null;
      this.rafId = null;
      this.isActive = false;
      this.isVisible = false;
      this.mode = 'starfield'; // 'starfield' | 'underwater' | 'kitt'

      // Canvas dimensions & scaling
      this.width = 0;
      this.height = 0;
      this.dpr = 1;
      this.centerX = 0;
      this.centerY = 0;

      // Telemetry state
      this.speedMph = 0;
      this.targetSpeedMph = 0;
      this.heading = 0;
      this.targetHeading = 0;
      this.altitude = 0;
      this.pitch = 58;

      // K.I.T.T. Internal State for Map Embedding
      this.kittScannerPos = 0;
      this.kittScannerDir = 1;
      this.kittScannerTrails = [0, 0, 0, 0, 0, 0, 0, 0];
      this.kittVoiceLevels = [0, 0, 0];
      this.kittCadencePhase = 0;
      this.circuitNodes = [];
      this.circuitTraces = [];
      this.dataPackets = [];
      this.pcbComponents = [];
      this.pcbVias = [];
      this.spmPhase = 0;

      // Live Weather Reactive State
      this.tempF = 72;
      this.humidity = 45;
      this.uvIndex = 2.5;

      // Fidget & Inertia Physics
      this.manualRotation = 0;
      this.angularVelocity = 0;
      this.isDragging = false;
      this.lastPointerX = 0;
      this.lastPointerY = 0;
      this.lastPointerAngle = 0;
      this.dragFriction = 0.94;
      this.returnSpringStrength = 0.05;

      // Ripple & Shockwave particles
      this.ripples = [];

      // Starfield population (3D spherical coordinates)
      this.numStars = 340;
      this.stars = [];

      // Underwater Ocean Population
      this.numBubbles = 110;
      this.bubbles = [];
      this.numFishes = 14;
      this.fishes = [];
      this.causticPhase = 0;

      // Orbital Rings rotation state
      this.ringRotation = 0;
      this.pulsePhase = 0;

      // Stampede Canyon Wildlife & Sensor Telemetry state
      this.stampedeDust = [];
      this.stampedeAnimals = [];
      this.stampedeTrees = [];
      this.stampedeGrassTufts = [];
      this.stampedeStars = [];
      this.stampedeEagles = [];
      this.stampedeClouds = [];
      this.stampedePhase = 0;

      // Sensor Coupling & Multi-Axis Parallax Engine
      this.sensorTiltX = 0;       // Current smoothed roll tilt (-35 to +35 deg)
      this.targetTiltX = 0;
      this.sensorTiltY = 0;       // Current smoothed pitch tilt (-30 to +30 deg)
      this.targetTiltY = 0;
      this.sensorSteerTilt = 0;   // Centrifugal roll inertia during vehicle turns
      this.sensorAccel = 0;       // Speed acceleration / deceleration delta
      this.lastSpeedMph = 0;
      this.lastHeading = 0;
      this._prevKittHeading = 0;
      this.swayAngle = 0;

      // Bound event listeners
      this._onResize = this._onResize.bind(this);
      this._onPointerDown = this._onPointerDown.bind(this);
      this._onPointerMove = this._onPointerMove.bind(this);
      this._onPointerUp = this._onPointerUp.bind(this);
      this._onCanvasPointerMove = this._onCanvasPointerMove.bind(this);
      this._onCanvasPointerLeave = this._onCanvasPointerLeave.bind(this);
      this._onDeviceOrientation = this._onDeviceOrientation.bind(this);
      this._onDeviceMotion = this._onDeviceMotion.bind(this);
      this._loop = this._loop.bind(this);
    }

    init(containerEl) {
      if (!containerEl) return;
      this.container = containerEl;

      // Create canvas if not already in DOM
      let canvas = this.container.querySelector('#kinetic-console-canvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'kinetic-console-canvas';
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'none';
        canvas.style.zIndex = '3';
        canvas.style.borderRadius = '11px';
        canvas.style.touchAction = 'none';
        canvas.style.cursor = 'grab';
        this.container.appendChild(canvas);
      }
      this.canvas = canvas;
      this.ctx = this.canvas.getContext('2d');

      this._initStarfield();
      this._initUnderwater();
      this._initKitt();
      this._bindEvents();
      this._updateDimensions();
    }

    setMode(mode) {
      if (mode === 'kitt') {
        this.mode = 'kitt';
        this._initKitt();
      } else if (mode === 'underwater') {
        this.mode = 'underwater';
        this._initUnderwater();
      } else if (mode === 'stampede') {
        this.mode = 'stampede';
        this._initStampede();
      } else {
        this.mode = 'starfield';
        this._initStarfield();
      }
    }

    _initStampede() {
      this.stampedeDust = [];
      this.stampedeAnimals = [];
      this.stampedeFlora = []; // Trees and Giant Saguaro Cacti
      this.stampedeGrassTufts = [];
      this.stampedeStars = [];
      this.stampedeEagles = [];
      this.stampedePhase = 0;

      const w = this.canvas ? this.canvas.width : 400;
      const h = this.canvas ? this.canvas.height : 300;

      // 1. Canyon Night Stars (Twinkling celestial dome)
      for (let i = 0; i < 65; i++) {
        this.stampedeStars.push({
          x: Math.random(),
          y: Math.random() * 0.44, // Upper sky dome above horizon
          size: Math.random() * 1.8 + 0.6,
          twinkleSpeed: Math.random() * 0.04 + 0.015,
          phase: Math.random() * Math.PI * 2,
          colorVar: Math.random() > 0.7 ? '#bae6fd' : (Math.random() > 0.5 ? '#fed7aa' : '#ffffff')
        });
      }

      // 2. Roadside Saguaro Cacti & Swaying Trees (Pines, Junipers, Acacias, Giant Saguaro)
      const floraTypes = ['cactus', 'pine', 'cactus', 'juniper', 'cactus', 'acacia', 'pine', 'cactus'];
      for (let i = 0; i < 22; i++) {
        const side = (i % 2 === 0) ? -1 : 1;
        const z = 0.08 + (i / 22) * 0.88 + (Math.random() - 0.5) * 0.04;
        const fType = floraTypes[i % floraTypes.length];
        this.stampedeFlora.push({
          side: side,
          xOffset: 0.58 + Math.random() * 0.48, // Along roadside margins
          z: Math.max(0.08, Math.min(0.96, z)),
          type: fType,
          height: fType === 'cactus' ? (32 + Math.random() * 22) : (36 + Math.random() * 28),
          width: fType === 'cactus' ? (18 + Math.random() * 12) : (22 + Math.random() * 14),
          arms: Math.floor(Math.random() * 3 + 1), // Saguaro arms
          swayPhase: Math.random() * Math.PI * 2,
          flexibility: fType === 'cactus' ? (Math.random() * 0.2 + 0.45) : (Math.random() * 0.4 + 0.8)
        });
      }

      // 3. Prairie Terrain Swaying Grass Tufts
      for (let i = 0; i < 45; i++) {
        this.stampedeGrassTufts.push({
          x: (Math.random() - 0.5) * 2.1,
          z: Math.random() * 0.92 + 0.08,
          blades: Math.floor(Math.random() * 5 + 4),
          height: Math.random() * 8 + 5,
          swayOffset: Math.random() * Math.PI * 2
        });
      }

      // 4. Wildlife Ecosystem with Staggered Horizon Gallop
      const allSpecies = ['bison', 'mustang', 'pronghorn', 'elk', 'ram', 'giraffe', 'snake'];
      this.stampedeAnimals = [];
      // Pool of 5 animal slots: 2 to 3 active at staggered depths, remaining in queue
      for (let i = 0; i < 5; i++) {
        const species = allSpecies[Math.floor(Math.random() * allSpecies.length)];
        const isActive = i < 3; // First 3 active, remaining 2 in cooldown queue
        const drift = (Math.random() - 0.5) * 0.0025;
        this.stampedeAnimals.push({
          species: species,
          active: isActive,
          spawnTimer: isActive ? 0 : Math.floor(Math.random() * 90 + 40),
          x: (Math.random() - 0.5) * 1.4,
          driftX: drift,
          facing: drift >= 0 ? -1 : 1,
          z: isActive ? (0.35 + i * 0.26) : 1.04, // Staggered depths towards horizon
          speedOffset: Math.random() * 0.28 + 0.86,
          gallopPhase: Math.random() * Math.PI * 2,
          slitherPhase: Math.random() * Math.PI * 2,
          size: species === 'giraffe' ? (Math.random() * 0.2 + 1.25) : (species === 'snake' ? (Math.random() * 0.2 + 1.1) : (Math.random() * 0.25 + 1.15)),
          tailFlickTimer: Math.random() * 100,
          coatVariant: Math.floor(Math.random() * 3)
        });
      }

      // 5. Soaring Night Eagles & Birds (Pair circling in the heavens)
      this.stampedeEagles = [];
      for (let e = 0; e < 2; e++) {
        this.stampedeEagles.push({
          angle: (e * Math.PI) + (Math.random() - 0.5) * 0.5,
          radiusX: 0.26 + e * 0.08,
          radiusY: 0.07 + e * 0.03,
          speed: (Math.random() * 0.01 + 0.008) * (e % 2 === 0 ? 1 : -1),
          height: 0.13 + e * 0.08,
          wingSpan: 16 + e * 3,
          wingFlap: 0
        });
      }

      // 5b. Slowly Moving Canyon Twilight Clouds
      this.stampedeClouds = [];
      const cloudPuffSets = [
        [{ ox: 0, oy: 0, r: 1.0 }, { ox: -0.35, oy: 0.12, r: 0.75 }, { ox: 0.35, oy: 0.10, r: 0.8 }, { ox: -0.65, oy: 0.22, r: 0.55 }, { ox: 0.65, oy: 0.20, r: 0.58 }],
        [{ ox: 0, oy: 0, r: 1.0 }, { ox: -0.4, oy: 0.10, r: 0.8 }, { ox: 0.45, oy: 0.12, r: 0.75 }, { ox: 0.8, oy: 0.22, r: 0.5 }],
        [{ ox: 0, oy: 0, r: 0.9 }, { ox: -0.3, oy: 0.10, r: 0.7 }, { ox: 0.3, oy: 0.12, r: 0.7 }]
      ];
      for (let c = 0; c < 5; c++) {
        this.stampedeClouds.push({
          x: (c / 5) * 1.3 - 0.15,
          y: 0.08 + Math.random() * 0.28,
          speed: 0.00018 + Math.random() * 0.00016,
          width: 75 + Math.random() * 65,
          puffs: cloudPuffSets[c % cloudPuffSets.length],
          opacity: 0.24 + Math.random() * 0.18
        });
      }

      // 6. Ambient Desert Dust Motes
      const numDust = 60;
      for (let i = 0; i < numDust; i++) {
        this.stampedeDust.push({
          x: (Math.random() - 0.5) * (w || 400) * 1.4,
          y: (Math.random() * 0.6 + 0.38) * (h || 300),
          z: Math.random() * 0.9 + 0.1,
          size: Math.random() * 14 + 6,
          alpha: Math.random() * 0.3 + 0.08,
          vx: (Math.random() - 0.5) * 0.9,
          vy: -Math.random() * 0.6 - 0.2,
          life: Math.random() * 100
        });
      }
    }

    _initKitt() {
      this.circuitNodes = [];
      this.circuitTraces = [];
      this.dataPackets = [];
      this.pcbComponents = [];
      this.pcbTestPoints = [];
      this.pcbVias = [];

      // 1. Integrated Circuits (ICs) & Active Hardware Components (Normalized [-1, 1] Coordinates)
      // Clean, focused layout: Central Hero DSP Chip flanked by 2 iconic secondary components
      this.pcbComponents = [
        {
          id: 'u1_cpu',
          type: 'qfp',
          name: 'SYNTH-DSP 8800',
          sub: 'ARM AUDIO DSP',
          nx: 0.0,
          ny: 0.0,
          nw: 0.62,
          nh: 0.62,
          pins: 32 // 8 per side
        },
        {
          id: 'y1_crystal',
          type: 'crystal',
          name: '16.000 MHz',
          sub: 'OSC',
          nx: -0.58,
          ny: -0.58,
          nw: 0.24,
          nh: 0.12,
          pins: 2
        },
        {
          id: 'u2_eeprom',
          type: 'soic',
          name: '24C512',
          sub: 'SOUND ROM',
          nx: 0.58,
          ny: -0.58,
          nw: 0.20,
          nh: 0.20,
          pins: 8 // 4 per side
        }
      ];

      // 2. Zero Micro-Clutter Test Points
      this.pcbTestPoints = [];

      // 3. Four Precision Corner Mounting Holes (Gold Annular Rings with Dark Drill Vias)
      const viaCoords = [
        [-0.84, -0.84], [0.84, -0.84],
        [-0.84, 0.84], [0.84, 0.84]
      ];
      this.pcbVias = viaCoords.map(([nx, ny], idx) => ({
        id: `via_${idx}`,
        nx,
        ny,
        radius: 4.2,
        holeRadius: 2.0,
        glow: 0.45
      }));

      // 4. Conductive Gold & Copper PCB Traces with 45° Chamfered Doglegs
      const rawTraces = [
        // Differential Clock Bus: Crystal Y1 -> CPU Top-Left Pins
        {
          pts: [{nx: -0.46, ny: -0.58}, {nx: -0.32, ny: -0.58}, {nx: -0.18, ny: -0.44}, {nx: -0.18, ny: -0.30}],
          type: 'clock', width: 2.0, color: '#22c55e', alpha: 0.60
        },
        {
          pts: [{nx: -0.46, ny: -0.54}, {nx: -0.30, ny: -0.54}, {nx: -0.12, ny: -0.36}, {nx: -0.12, ny: -0.30}],
          type: 'clock', width: 2.0, color: '#22c55e', alpha: 0.60
        },
        // High-Speed Sound ROM Bus: EEPROM -> CPU Top-Right Pins
        {
          pts: [{nx: 0.48, ny: -0.58}, {nx: 0.32, ny: -0.58}, {nx: 0.18, ny: -0.44}, {nx: 0.18, ny: -0.30}],
          type: 'bus', width: 2.0, color: '#ffd700', alpha: 0.65
        },
        {
          pts: [{nx: 0.48, ny: -0.54}, {nx: 0.30, ny: -0.54}, {nx: 0.12, ny: -0.36}, {nx: 0.12, ny: -0.30}],
          type: 'bus', width: 2.0, color: '#ffd700', alpha: 0.65
        },
        // Stereo Audio DAC Output: CPU Bottom Pins -> Lower Corner Audio Terminals
        {
          pts: [{nx: -0.16, ny: 0.30}, {nx: -0.16, ny: 0.45}, {nx: -0.36, ny: 0.65}, {nx: -0.65, ny: 0.65}],
          type: 'audio_l', width: 2.4, color: '#38bdf8', alpha: 0.70
        },
        {
          pts: [{nx: 0.16, ny: 0.30}, {nx: 0.16, ny: 0.45}, {nx: 0.36, ny: 0.65}, {nx: 0.65, ny: 0.65}],
          type: 'audio_r', width: 2.4, color: '#fb923c', alpha: 0.70
        },
        // Lateral Telemetry Bus Lines (Gyro IMU & Speed Vector)
        {
          pts: [{nx: -0.76, ny: 0.0}, {nx: -0.30, ny: 0.0}],
          type: 'gyro', width: 2.2, color: '#38bdf8', alpha: 0.65
        },
        {
          pts: [{nx: 0.76, ny: 0.0}, {nx: 0.30, ny: 0.0}],
          type: 'speed', width: 2.2, color: '#ffd700', alpha: 0.65
        }
      ];

      // Pre-compute trace lengths and cumulative segment lengths for smooth packet traveling
      this.circuitTraces = rawTraces.map((trace, idx) => {
        let totalLen = 0;
        const segLens = [];
        for (let i = 0; i < trace.pts.length - 1; i++) {
          const dx = trace.pts[i + 1].nx - trace.pts[i].nx;
          const dy = trace.pts[i + 1].ny - trace.pts[i].ny;
          const len = Math.sqrt(dx * dx + dy * dy);
          segLens.push(len);
          totalLen += len;
        }
        return {
          id: `trace_${idx}`,
          pts: trace.pts,
          type: trace.type,
          width: trace.width,
          color: trace.color,
          alpha: trace.alpha,
          segLens: segLens,
          totalLen: totalLen,
          pulseGlow: 0
        };
      });

      // 5. Kinetic Data Packets (Conductive Current Pulses along the 8 hero buses)
      this.dataPackets = [];
      const packetColors = ['#22c55e', '#22c55e', '#ffd700', '#ffd700', '#38bdf8', '#fb923c', '#38bdf8', '#ffd700'];
      for (let k = 0; k < 8; k++) {
        this.dataPackets.push({
          traceIdx: k % this.circuitTraces.length,
          t: (k * 0.125) % 1.0,
          baseSpeed: 0.008 + (k % 3) * 0.004,
          color: packetColors[k % packetColors.length],
          size: 2.6,
          trailLen: 0.14
        });
      }
    }

    _getActiveStarPalette() {
      if (this.tempF >= 80) return STAR_PALETTES.warm;
      if (this.tempF <= 55) return STAR_PALETTES.cool;
      return STAR_PALETTES.temperate;
    }

    _initStarfield() {
      this.stars = [];
      const palette = this._getActiveStarPalette();
      for (let i = 0; i < this.numStars; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const radius = 160 + Math.random() * 700;
        const color = palette[Math.floor(Math.random() * palette.length)];

        this.stars.push({
          x: radius * Math.sin(phi) * Math.cos(theta),
          y: radius * Math.sin(phi) * Math.sin(theta),
          z: radius * Math.cos(phi),
          baseSize: 0.9 + Math.random() * 2.6,
          color: color,
          pulseSpeed: 0.02 + Math.random() * 0.05,
          pulseOffset: Math.random() * Math.PI * 2
        });
      }
    }

    _initUnderwater() {
      this.numBubbles = 36;
      this.bubbles = [];
      for (let i = 0; i < this.numBubbles; i++) {
        this.bubbles.push({
          x: Math.random() * 1000,
          y: Math.random() * 1000,
          size: 1.8 + Math.random() * 5.0,
          speedY: 0.7 + Math.random() * 1.8,
          wobbleSpeed: 0.03 + Math.random() * 0.05,
          wobbleOffset: Math.random() * Math.PI * 2,
          opacity: 0.20 + Math.random() * 0.45
        });
      }

      this.creatures = [];

      // 1. Sea Turtles (2 gentle gliders)
      for (let i = 0; i < 2; i++) {
        this.creatures.push({
          type: 'turtle',
          x: Math.random() * 800,
          y: 70 + Math.random() * 320,
          speed: (0.35 + Math.random() * 0.4) * (i % 2 === 0 ? 1 : -1),
          scale: 1.25 + Math.random() * 0.35,
          phase: Math.random() * Math.PI * 2,
          depth: 0.85 + Math.random() * 0.15
        });
      }

      // 2. Manta Rays (2 majestic gliders)
      for (let i = 0; i < 2; i++) {
        this.creatures.push({
          type: 'ray',
          x: Math.random() * 800,
          y: 60 + Math.random() * 260,
          speed: (0.45 + Math.random() * 0.45) * (i % 2 === 0 ? 1 : -1),
          scale: 1.35 + Math.random() * 0.4,
          phase: Math.random() * Math.PI * 2,
          depth: 0.90 + Math.random() * 0.1
        });
      }

      // 3. Bioluminescent Jellyfish (3 vertical drifters)
      for (let i = 0; i < 3; i++) {
        this.creatures.push({
          type: 'jelly',
          x: 60 + Math.random() * 700,
          y: 80 + Math.random() * 400,
          speedX: (Math.random() - 0.5) * 0.25,
          speedY: -(0.25 + Math.random() * 0.35),
          scale: 1.1 + Math.random() * 0.3,
          phase: Math.random() * Math.PI * 2,
          color: i === 0 ? '#38bdf8' : (i === 1 ? '#f472b6' : '#c084fc'),
          depth: 0.8 + Math.random() * 0.2
        });
      }

      // 4. Vibrant Clownfish (3 striped swimmers)
      for (let i = 0; i < 3; i++) {
        this.creatures.push({
          type: 'clownfish',
          x: Math.random() * 800,
          y: 80 + Math.random() * 380,
          speed: (0.8 + Math.random() * 0.8) * (Math.random() > 0.5 ? 1 : -1),
          scale: 1.1 + Math.random() * 0.25,
          phase: Math.random() * Math.PI * 2,
          depth: 0.75 + Math.random() * 0.25
        });
      }

      // 5. Regal Blue Tangs & Golden Angelfish (5 tropical beauties)
      const tropicalTypes = ['tang', 'angelfish', 'tang', 'angelfish', 'tang'];
      for (let i = 0; i < tropicalTypes.length; i++) {
        this.creatures.push({
          type: tropicalTypes[i],
          x: Math.random() * 800,
          y: 50 + Math.random() * 420,
          speed: (0.7 + Math.random() * 0.9) * (Math.random() > 0.5 ? 1 : -1),
          scale: 1.15 + Math.random() * 0.3,
          phase: Math.random() * Math.PI * 2,
          depth: 0.7 + Math.random() * 0.3
        });
      }
    }

    _bindEvents() {
      window.addEventListener('resize', this._onResize, { passive: true });
      window.addEventListener('deviceorientation', this._onDeviceOrientation, { passive: true });
      window.addEventListener('devicemotion', this._onDeviceMotion, { passive: true });

      if (this.canvas) {
        this.canvas.addEventListener('pointerdown', this._onPointerDown);
        this.canvas.addEventListener('pointermove', this._onCanvasPointerMove);
        this.canvas.addEventListener('pointerleave', this._onCanvasPointerLeave);
        window.addEventListener('pointermove', this._onPointerMove);
        window.addEventListener('pointerup', this._onPointerUp);
        window.addEventListener('pointercancel', this._onPointerUp);
      }
    }

    _onDeviceOrientation(e) {
      if (!this.isVisible) return;
      if (e.gamma !== null && !isNaN(e.gamma)) {
        // gamma is left-to-right roll (-90 to 90 deg)
        this.targetTiltX = Math.max(-35, Math.min(35, e.gamma));
      }
      if (e.beta !== null && !isNaN(e.beta)) {
        // beta is front-to-back pitch (-180 to 180 deg)
        // Mounted phone on dashboard typically sits around 50° to 70° from flat
        const pitchDelta = e.beta - 55;
        this.targetTiltY = Math.max(-30, Math.min(30, pitchDelta));
      }
    }

    _onDeviceMotion(e) {
      if (!this.isVisible) return;
      if (e.accelerationIncludingGravity && e.accelerationIncludingGravity.x !== null && !isNaN(e.accelerationIncludingGravity.x)) {
        const ax = e.accelerationIncludingGravity.x || 0;
        this.targetTiltX = Math.max(-35, Math.min(35, ax * 3.5));
      }
      if (e.accelerationIncludingGravity && e.accelerationIncludingGravity.y !== null && !isNaN(e.accelerationIncludingGravity.y)) {
        const ay = e.accelerationIncludingGravity.y || 0;
        this.targetTiltY = Math.max(-30, Math.min(30, (ay - 7.5) * 3.5));
      }
    }

    _onCanvasPointerMove(e) {
      if (!this.isVisible || this.isDragging) return;
      const rect = this.canvas.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const my = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      this.targetTiltX = Math.max(-32, Math.min(32, mx * 28));
      this.targetTiltY = Math.max(-28, Math.min(28, my * 24));
    }

    _onCanvasPointerLeave() {
      if (!this.isVisible || this.isDragging) return;
      this.targetTiltX = 0;
      this.targetTiltY = 0;
    }

    _updateDimensions() {
      if (!this.canvas || !this.container) return;
      const rect = this.container.getBoundingClientRect();
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.width = rect.width;
      this.height = rect.height;

      this.canvas.width = Math.round(this.width * this.dpr);
      this.canvas.height = Math.round(this.height * this.dpr);
      this.centerX = (this.width * this.dpr) / 2;
      this.centerY = (this.height * this.dpr) / 2;
    }

    _onResize() {
      if (this.isVisible) {
        this._updateDimensions();
      }
    }

    _getAngleFromCenter(x, y) {
      const rect = this.canvas.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      return Math.atan2(y - cy, x - cx);
    }

    _onPointerDown(e) {
      if (!this.isVisible) return;
      this.isDragging = true;
      this.angularVelocity = 0;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
      this.lastPointerAngle = this._getAngleFromCenter(e.clientX, e.clientY);
      if (this.canvas) this.canvas.style.cursor = 'grabbing';

      const rect = this.canvas.getBoundingClientRect();
      const tx = (e.clientX - rect.left) * this.dpr;
      const ty = (e.clientY - rect.top) * this.dpr;
      this.createShockwave(tx, ty);
    }

    _onPointerMove(e) {
      if (!this.isDragging || !this.isVisible) return;
      const currentAngle = this._getAngleFromCenter(e.clientX, e.clientY);
      let deltaAngle = currentAngle - this.lastPointerAngle;

      if (deltaAngle > Math.PI) deltaAngle -= Math.PI * 2;
      if (deltaAngle < -Math.PI) deltaAngle += Math.PI * 2;

      this.manualRotation += deltaAngle;
      this.angularVelocity = deltaAngle * 0.85;

      this.lastPointerAngle = currentAngle;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
    }

    _onPointerUp() {
      if (!this.isDragging) return;
      this.isDragging = false;
      if (this.canvas) this.canvas.style.cursor = 'grab';
    }

    createShockwave(x, y) {
      const isOcean = this.mode === 'underwater';
      const rippleColor = isOcean ? '#38bdf8' : (this.tempF >= 80 ? '#fb923c' : (this.tempF <= 55 ? '#38bdf8' : '#fde047'));
      this.ripples.push({
        x: x !== undefined ? x : this.centerX,
        y: y !== undefined ? y : this.centerY,
        radius: 10,
        maxRadius: Math.max(this.width, this.height) * 0.75 * this.dpr,
        opacity: 0.95,
        color: rippleColor
      });
    }

    updateTelemetry({ speedMph, heading, altitude, pitch, tempF, humidity, uvIndex }) {
      if (speedMph !== undefined && !isNaN(speedMph)) {
        this.targetSpeedMph = Math.max(0, speedMph);
      }
      if (heading !== undefined && !isNaN(heading)) {
        this.targetHeading = (heading % 360 + 360) % 360;
      }
      if (altitude !== undefined && !isNaN(altitude)) {
        this.altitude = altitude;
      }
      if (pitch !== undefined && !isNaN(pitch)) {
        this.pitch = pitch;
      }
      if (tempF !== undefined && !isNaN(tempF)) {
        const oldPalette = this._getActiveStarPalette();
        this.tempF = tempF;
        const newPalette = this._getActiveStarPalette();
        if (oldPalette !== newPalette && this.mode === 'starfield') {
          this._initStarfield();
        }
      }
      if (humidity !== undefined && !isNaN(humidity)) {
        this.humidity = humidity;
      }
      if (uvIndex !== undefined && !isNaN(uvIndex)) {
        this.uvIndex = uvIndex;
      }
    }

    show() {
      if (!this.canvas) return;
      this.isVisible = true;
      this.canvas.style.display = 'block';
      this._updateDimensions();
      this.start();
    }

    hide() {
      if (!this.canvas) return;
      this.isVisible = false;
      this.canvas.style.display = 'none';
      this.stop();
    }

    start() {
      if (this.isActive) return;
      this.isActive = true;
      this.rafId = requestAnimationFrame(this._loop);
    }

    stop() {
      this.isActive = false;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    }

    _loop() {
      if (!this.isActive || !this.isVisible) return;

      try {
        this._updatePhysics();
        if (this.mode === 'kitt') {
          this._renderKittMode();
        } else if (this.mode === 'underwater') {
          this._renderUnderwater();
        } else if (this.mode === 'stampede') {
          this._renderStampedeMode();
        } else {
          this._renderStarfieldMode();
        }
      } catch (err) {
        console.warn('KineticConsole render loop error:', err);
      } finally {
        if (this.isActive && this.isVisible) {
          this.rafId = requestAnimationFrame(this._loop);
        }
      }
    }

    _updatePhysics() {
      this.speedMph += (this.targetSpeedMph - this.speedMph) * 0.08;

      let diffHeading = (this.targetHeading - this.heading);
      while (diffHeading < -180) diffHeading += 360;
      while (diffHeading > 180) diffHeading -= 360;
      this.heading += diffHeading * 0.06;

      if (!this.isDragging) {
        this.manualRotation += this.angularVelocity;
        this.angularVelocity *= this.dragFriction;

        if (this.speedMph > 3) {
          this.manualRotation *= (1 - this.returnSpringStrength);
        }
      }

      const baseRotationSpeed = 0.003 + (this.speedMph / 100) * 0.015;
      this.ringRotation += baseRotationSpeed;
      this.pulsePhase += 0.035;
      this.causticPhase += 0.02 + (this.speedMph / 100) * 0.04;

      for (let i = this.ripples.length - 1; i >= 0; i--) {
        const r = this.ripples[i];
        r.radius += 5.5 * this.dpr;
        r.opacity *= 0.94;
        if (r.opacity < 0.01 || r.radius >= r.maxRadius) {
          this.ripples.splice(i, 1);
        }
      }
    }

    /* ------------------------------------------------------------- */
    /* VIBRANT & WEATHER-REACTIVE STARFIELD RENDERING                */
    /* ------------------------------------------------------------- */
    _renderStarfieldMode() {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;
      const cx = this.centerX;
      const cy = this.centerY;

      ctx.clearRect(0, 0, w, h);

      // Thermal background atmosphere
      let bgTop = '#060308';
      let bgBottom = '#0d0714';
      let nebulaCol1 = 'rgba(56, 189, 248, 0.09)'; // Cyan
      let nebulaCol2 = 'rgba(168, 85, 247, 0.08)'; // Purple

      if (this.tempF >= 80) {
        bgTop = '#0a0301';
        bgBottom = '#180702';
        nebulaCol1 = 'rgba(251, 146, 60, 0.12)';
        nebulaCol2 = 'rgba(244, 63, 94, 0.09)';
      } else if (this.tempF <= 55) {
        bgTop = '#01050a';
        bgBottom = '#020e1c';
        nebulaCol1 = 'rgba(56, 189, 248, 0.14)';
        nebulaCol2 = 'rgba(99, 102, 241, 0.08)';
      }

      const bgGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, Math.max(w, h) * 0.85);
      bgGrad.addColorStop(0, bgBottom);
      bgGrad.addColorStop(1, bgTop);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Humidity-Driven Nebular Clouds
      const humidityFactor = Math.min(1.0, Math.max(0.2, this.humidity / 75));
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = humidityFactor;

      const nebGrad1 = ctx.createRadialGradient(cx + Math.sin(this.ringRotation * 0.5) * 80, cy - 40, 10, cx, cy, w * 0.6);
      nebGrad1.addColorStop(0, nebulaCol1);
      nebGrad1.addColorStop(1, 'transparent');
      ctx.fillStyle = nebGrad1;
      ctx.fillRect(0, 0, w, h);

      const nebGrad2 = ctx.createRadialGradient(cx - 60, cy + Math.cos(this.ringRotation * 0.4) * 60, 10, cx, cy, w * 0.55);
      nebGrad2.addColorStop(0, nebulaCol2);
      nebGrad2.addColorStop(1, 'transparent');
      ctx.fillStyle = nebGrad2;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      // Render 3D Rings & Starfield Particles
      this._renderOrbitalRings(ctx, cx, cy);
      this._renderStarfieldParticles(ctx, cx, cy);
      this._renderRipples(ctx);
    }

    _renderOrbitalRings(ctx, cx, cy) {
      ctx.save();
      const tilt = 0.52;
      const headingRad = (this.heading * Math.PI) / 180;
      const totalAngle = this.ringRotation + this.manualRotation + headingRad;

      // Center glowing core with UV-Index flare bloom
      const uvBloom = Math.min(1.8, Math.max(0.8, this.uvIndex / 3.0));
      const corePulse = (14 + Math.sin(this.pulsePhase) * 2.5) * uvBloom;
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, corePulse * this.dpr);
      
      const coreColor = this.tempF >= 80 ? 'rgba(251, 146, 60, 0.7)' : (this.tempF <= 55 ? 'rgba(56, 189, 248, 0.7)' : 'rgba(253, 224, 71, 0.7)');
      coreGrad.addColorStop(0, coreColor);
      coreGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.25)');
      coreGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, corePulse * this.dpr, 0, Math.PI * 2);
      ctx.fill();

      // Ring 1: Inner Segmented Radar Ring
      const r1 = Math.min(cx, cy) * 0.36;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r1, r1 * tilt, totalAngle * 0.8, 0, Math.PI * 2);
      ctx.strokeStyle = this.tempF >= 80 ? 'rgba(251, 146, 60, 0.55)' : 'rgba(56, 189, 248, 0.55)';
      ctx.lineWidth = 1.8 * this.dpr;
      ctx.setLineDash([8 * this.dpr, 14 * this.dpr]);
      ctx.stroke();

      // Ring 2: Mid Dynamic Orbit
      const r2 = Math.min(cx, cy) * 0.62;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r2, r2 * tilt, -totalAngle * 0.5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1.3 * this.dpr;
      ctx.setLineDash([18 * this.dpr, 26 * this.dpr]);
      ctx.stroke();

      // Orbiting Telemetry Nodes (Pulsars)
      const numNodes = 3;
      for (let i = 0; i < numNodes; i++) {
        const nodeAngle = totalAngle * 0.6 + (i * Math.PI * 2) / numNodes;
        const nx = cx + r2 * Math.cos(nodeAngle);
        const ny = cy + r2 * tilt * Math.sin(nodeAngle);

        ctx.beginPath();
        ctx.arc(nx, ny, 3.8 * this.dpr, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 8 * this.dpr;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Ring 3: Outer Horizon Ring
      const r3 = Math.min(cx, cy) * 0.86;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r3, r3 * tilt, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.lineWidth = 1.4 * this.dpr;
      ctx.setLineDash([]);
      ctx.stroke();

      for (let a = 0; a < 4; a++) {
        const tickAngle = (a * Math.PI) / 2 + totalAngle * 0.2;
        const tx1 = cx + (r3 - 6 * this.dpr) * Math.cos(tickAngle);
        const ty1 = cy + (r3 - 6 * this.dpr) * tilt * Math.sin(tickAngle);
        const tx2 = cx + (r3 + 6 * this.dpr) * Math.cos(tickAngle);
        const ty2 = cy + (r3 + 6 * this.dpr) * tilt * Math.sin(tickAngle);

        ctx.beginPath();
        ctx.moveTo(tx1, ty1);
        ctx.lineTo(tx2, ty2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.0 * this.dpr;
        ctx.stroke();
      }

      ctx.restore();
    }

    _renderStarfieldParticles(ctx, cx, cy) {
      const fov = 340 * this.dpr;
      const speedFactor = Math.max(0.7, this.speedMph * 0.14);
      const warpStreakLength = Math.min(85 * this.dpr, this.speedMph * 1.35 * this.dpr);
      const rotationAngle = (this.heading * Math.PI) / 180 + this.manualRotation;

      const cosR = Math.cos(rotationAngle);
      const sinR = Math.sin(rotationAngle);

      for (let i = 0; i < this.stars.length; i++) {
        const star = this.stars[i];

        star.z -= speedFactor * (1.3 * this.dpr);
        if (star.z < 10) {
          star.z = 700;
          star.x = (Math.random() * 2 - 1) * 600;
          star.y = (Math.random() * 2 - 1) * 600;
        }

        const rotX = star.x * cosR - star.y * sinR;
        const rotY = star.x * sinR + star.y * cosR;

        const scale = fov / (fov + star.z);
        const px = cx + rotX * scale;
        const py = cy + rotY * scale;

        const twinkle = 0.65 + 0.35 * Math.sin(this.pulsePhase * star.pulseSpeed * 20 + star.pulseOffset);
        const alpha = Math.min(1, scale * 1.6) * twinkle;
        const size = star.baseSize * scale * this.dpr;

        if (px < -50 || px > this.canvas.width + 50 || py < -50 || py > this.canvas.height + 50) {
          continue;
        }

        ctx.save();
        ctx.globalAlpha = alpha;

        if (warpStreakLength > 2) {
          const streakFactor = (scale * warpStreakLength);
          const angleToCenter = Math.atan2(py - cy, px - cx);
          const sx = px + Math.cos(angleToCenter) * streakFactor;
          const sy = py + Math.sin(angleToCenter) * streakFactor;

          const streakGrad = ctx.createLinearGradient(px, py, sx, sy);
          streakGrad.addColorStop(0, star.color);
          streakGrad.addColorStop(1, 'transparent');

          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(sx, sy);
          ctx.strokeStyle = streakGrad;
          ctx.lineWidth = Math.max(1.2, size * 1.1);
          ctx.lineCap = 'round';
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(px, py, size * 1.1, 0, Math.PI * 2);
          ctx.fillStyle = star.color;
          ctx.shadowColor = star.color;
          ctx.shadowBlur = 4 * this.dpr;
          ctx.fill();
        }

        ctx.restore();
      }
    }

    /* ------------------------------------------------------------- */
    /* NEW LIGHT & RELAXING UNDERWATER OCEAN SIMULATION              */
    /* ------------------------------------------------------------- */
    _renderUnderwater() {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;
      const cx = this.centerX;
      const cy = this.centerY;

      ctx.clearRect(0, 0, w, h);

      // Tropical Sunlit Marine Gradient
      const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
      oceanGrad.addColorStop(0, '#38bdf8');   // Sunlit turquoise sky/surface
      oceanGrad.addColorStop(0.4, '#0ea5e9'); // Clear azure water
      oceanGrad.addColorStop(1, '#0369a1');   // Deep cobalt seafloor
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, w, h);

      // Caustic Shimmering Sunbeams
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (let b = 0; b < 6; b++) {
        const beamAngle = -0.25 + (b * 0.1) + Math.sin(this.causticPhase + b) * 0.04;
        const beamX = cx + (b - 2.5) * (w * 0.18);
        const beamGrad = ctx.createLinearGradient(beamX, 0, beamX + Math.sin(beamAngle) * h, h);
        beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
        beamGrad.addColorStop(0.6, 'rgba(224, 242, 254, 0.10)');
        beamGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(beamX - 30 * this.dpr, 0);
        ctx.lineTo(beamX + 30 * this.dpr, 0);
        ctx.lineTo(beamX + Math.sin(beamAngle) * h + 80 * this.dpr, h);
        ctx.lineTo(beamX + Math.sin(beamAngle) * h - 80 * this.dpr, h);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Render Marine Swimming Life
      const headingRad = (this.heading * Math.PI) / 180 + this.manualRotation;
      const speedOffset = (this.speedMph * 0.15) * this.dpr;

      ctx.save();
      const creatures = this.creatures || [];
      for (let i = 0; i < creatures.length; i++) {
        const c = creatures[i];
        
        if (c.type === 'jelly') {
          c.x += (c.speedX * this.dpr);
          c.y += (c.speedY * this.dpr) - (this.speedMph * 0.05 * this.dpr);
          c.phase += 0.05;
          if (c.y < -80) { c.y = h + 80; c.x = 60 + Math.random() * (w - 120); }
          if (c.x < -60) c.x = w + 60;
          if (c.x > w + 60) c.x = -60;

          const scale = c.scale * this.dpr;
          const pulse = 1 + Math.sin(c.phase * 3) * 0.18;
          ctx.save();
          ctx.translate(c.x, c.y);
          ctx.scale(scale, scale);
          ctx.globalAlpha = c.depth * 0.75;

          // Jellyfish Bell (translucent dome)
          ctx.beginPath();
          ctx.arc(0, 0, 18 * pulse, Math.PI, 0, false);
          ctx.bezierCurveTo(18 * pulse, 12 / pulse, -18 * pulse, 12 / pulse, -18 * pulse, 0);
          ctx.fillStyle = c.color;
          ctx.shadowColor = c.color;
          ctx.shadowBlur = 10 * this.dpr;
          ctx.fill();
          ctx.shadowBlur = 0;

          // Inner dome glow
          ctx.beginPath();
          ctx.arc(0, -2, 10 * pulse, Math.PI, 0, false);
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = c.depth * 0.45;
          ctx.fill();

          // Undulating Tentacles
          ctx.strokeStyle = c.color;
          ctx.lineWidth = 1.4;
          ctx.globalAlpha = c.depth * 0.6;
          for (let t = -3; t <= 3; t += 2) {
            const tx = t * 4 * pulse;
            ctx.beginPath();
            ctx.moveTo(tx, 6);
            ctx.quadraticCurveTo(tx + Math.sin(c.phase * 2 + t) * 8, 22, tx + Math.sin(c.phase * 2 + t * 0.5) * 6, 42);
            ctx.stroke();
          }
          ctx.restore();
          continue;
        }

        // Horizontal Swimming Creatures (Turtle, Ray, Clownfish, Tang, Angelfish)
        c.x += (c.speed * 1.5 * this.dpr) + (Math.sin(headingRad) * speedOffset * c.depth);
        c.phase += 0.08;

        if (c.x > w + 90) c.x = -90;
        if (c.x < -90) c.x = w + 90;

        const fy = c.y + Math.sin(c.phase * 0.7) * 7 * this.dpr;
        const scale = c.scale * this.dpr;
        const dir = c.speed > 0 ? 1 : -1;

        ctx.save();
        ctx.translate(c.x, fy);
        ctx.scale(dir * scale, scale);
        ctx.globalAlpha = c.depth * 0.90;

        if (c.type === 'turtle') {
          // --- SEA TURTLE ---
          const flipperFlap = Math.sin(c.phase * 1.4) * 0.35;
          
          // Front Flippers
          ctx.save();
          ctx.fillStyle = '#065f46';
          // Top flipper
          ctx.beginPath();
          ctx.ellipse(8, -16 + flipperFlap * 14, 18, 7, -0.4 + flipperFlap, 0, Math.PI * 2);
          ctx.fill();
          // Bottom flipper
          ctx.beginPath();
          ctx.ellipse(8, 16 - flipperFlap * 14, 18, 7, 0.4 - flipperFlap, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Rear Flippers
          ctx.fillStyle = '#047857';
          ctx.beginPath();
          ctx.ellipse(-18, -10, 9, 4, -0.6, 0, Math.PI * 2);
          ctx.ellipse(-18, 10, 9, 4, 0.6, 0, Math.PI * 2);
          ctx.fill();

          // Shell (Carapace)
          ctx.beginPath();
          ctx.ellipse(0, 0, 22, 16, 0, 0, Math.PI * 2);
          ctx.fillStyle = '#0f766e';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#34d399';
          ctx.stroke();

          // Shell Scute Patterns
          ctx.fillStyle = '#064e3b';
          ctx.beginPath();
          ctx.ellipse(0, 0, 12, 8, 0, 0, Math.PI * 2);
          ctx.fill();

          // Head
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.ellipse(24, 0, 9, 6, 0, 0, Math.PI * 2);
          ctx.fill();

          // Eye
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(26, -2, 1.4, 0, Math.PI * 2);
          ctx.fill();

        } else if (c.type === 'ray') {
          // --- MANTA RAY ---
          const wingWave = Math.sin(c.phase * 1.6) * 0.3;
          
          // Long Whip Tail
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(-16, 0);
          ctx.quadraticCurveTo(-38, Math.sin(c.phase) * 6, -60, Math.sin(c.phase * 0.8) * 10);
          ctx.stroke();

          // Diamond Body & Wings
          ctx.beginPath();
          ctx.moveTo(20, 0);
          ctx.quadraticCurveTo(6, -28 + wingWave * 16, -14, -22 + wingWave * 14);
          ctx.quadraticCurveTo(-8, -4, -18, 0);
          ctx.quadraticCurveTo(-8, 4, -14, 22 - wingWave * 14);
          ctx.quadraticCurveTo(6, 28 - wingWave * 16, 20, 0);
          ctx.fillStyle = '#1e293b';
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = '#38bdf8';
          ctx.stroke();

          // Dorsal markings
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.ellipse(2, 0, 8, 4, 0, 0, Math.PI * 2);
          ctx.fill();

          // Cephalic Horns/Fins
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.ellipse(22, -6, 5, 2.5, -0.3, 0, Math.PI * 2);
          ctx.ellipse(22, 6, 5, 2.5, 0.3, 0, Math.PI * 2);
          ctx.fill();

        } else if (c.type === 'clownfish') {
          // --- CLOWNFISH (Nemo Striped) ---
          const tailWag = Math.sin(c.phase * 2.5) * 4;
          
          // Tail
          ctx.fillStyle = '#ea580c';
          ctx.beginPath();
          ctx.moveTo(-10, 0);
          ctx.lineTo(-22, -8 + tailWag);
          ctx.lineTo(-18, 0);
          ctx.lineTo(-22, 8 + tailWag);
          ctx.closePath();
          ctx.fill();

          // Main Orange Body
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.ellipse(0, 0, 16, 10, 0, 0, Math.PI * 2);
          ctx.fill();

          // White Vertical Stripes with Black Edges
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1.2;

          // Head stripe
          ctx.beginPath();
          ctx.ellipse(6, 0, 3, 9, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Mid stripe
          ctx.beginPath();
          ctx.ellipse(-2, 0, 3.2, 9.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Tail stripe
          ctx.beginPath();
          ctx.ellipse(-10, 0, 2.2, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Eye
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(10, -3, 1.8, 0, Math.PI * 2);
          ctx.fill();

        } else if (c.type === 'angelfish') {
          // --- TROPICAL ANGELFISH ---
          const tailWag = Math.sin(c.phase * 2.2) * 4;

          // Tall Top & Bottom Fin streamers
          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.moveTo(2, -8);
          ctx.lineTo(-8, -26);
          ctx.lineTo(-10, -6);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(2, 8);
          ctx.lineTo(-8, 26);
          ctx.lineTo(-10, 6);
          ctx.closePath();
          ctx.fill();

          // Diamond Body
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.ellipse(0, 0, 15, 12, 0, 0, Math.PI * 2);
          ctx.fill();

          // Black Vertical Stripes
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.ellipse(4, 0, 2.2, 11, 0, 0, Math.PI * 2);
          ctx.ellipse(-3, 0, 2.5, 11, 0, 0, Math.PI * 2);
          ctx.fill();

          // Tail fin
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.moveTo(-12, 0);
          ctx.lineTo(-24, -10 + tailWag);
          ctx.lineTo(-18, 0);
          ctx.lineTo(-24, 10 + tailWag);
          ctx.closePath();
          ctx.fill();

          // Eye
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(8, -2, 1.6, 0, Math.PI * 2);
          ctx.fill();

        } else {
          // --- REGAL BLUE TANG ---
          const tailWag = Math.sin(c.phase * 2.4) * 4;

          // Body Oval
          ctx.fillStyle = '#2563eb';
          ctx.beginPath();
          ctx.ellipse(0, 0, 16, 10, 0, 0, Math.PI * 2);
          ctx.fill();

          // Black Swirl Pattern
          ctx.fillStyle = '#1e1b4b';
          ctx.beginPath();
          ctx.ellipse(-2, -2, 8, 4, 0.3, 0, Math.PI * 2);
          ctx.fill();

          // Yellow Tail and dorsal fin
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.moveTo(-10, 0);
          ctx.lineTo(-22, -9 + tailWag);
          ctx.lineTo(-18, 0);
          ctx.lineTo(-22, 9 + tailWag);
          ctx.closePath();
          ctx.fill();

          // Eye
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(9, -2, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
      ctx.restore();

      // Rising Air Bubbles & Hydrodynamic Slipstream
      const bubbleSpeedFactor = 1 + (this.speedMph / 25);
      ctx.save();
      for (let i = 0; i < this.bubbles.length; i++) {
        const b = this.bubbles[i];
        b.y -= (b.speedY * bubbleSpeedFactor * this.dpr);
        b.wobbleOffset += b.wobbleSpeed;
        const bx = b.x + Math.sin(b.wobbleOffset) * 4 * this.dpr;

        if (b.y < -20) {
          b.y = h + 20;
          b.x = Math.random() * w;
        }

        ctx.beginPath();
        ctx.arc(bx, b.y, b.size * this.dpr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${b.opacity})`;
        ctx.strokeStyle = `rgba(224, 242, 254, ${b.opacity + 0.2})`;
        ctx.lineWidth = 1 * this.dpr;
        ctx.fill();
        ctx.stroke();

        // Little bubble specular glint
        ctx.beginPath();
        ctx.arc(bx - b.size * 0.3 * this.dpr, b.y - b.size * 0.3 * this.dpr, b.size * 0.25 * this.dpr, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
      ctx.restore();

      // Shockwave Water Rings
      this._renderRipples(ctx);
    }

    _renderRipples(ctx) {
      if (this.ripples.length === 0) return;
      ctx.save();
      for (let i = 0; i < this.ripples.length; i++) {
        const r = this.ripples[i];
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = r.color;
        ctx.globalAlpha = r.opacity;
        ctx.lineWidth = 2.4 * this.dpr;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius * 0.7, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.globalAlpha = r.opacity * 0.6;
        ctx.lineWidth = 1.2 * this.dpr;
        ctx.stroke();
      }
      ctx.restore();
    }

    /* ------------------------------------------------------------- */
    /* CYBER ORBIT SYNTH & SENSOR-COUPLED PARALLAX PCB ENGINE      */
    /* ------------------------------------------------------------- */
    _renderKittMode() {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;
      const cx = this.centerX;
      const cy = this.centerY;

      // 1. Kinetic Sensor Physics & Acceleration Telemetry Tracking
      this.sensorTiltX += (this.targetTiltX - this.sensorTiltX) * 0.12;
      this.sensorTiltY += (this.targetTiltY - this.sensorTiltY) * 0.12;

      // Heading steering delta centrifugal roll inertia
      let headingDelta = (this.heading - (this._prevKittHeading !== undefined ? this._prevKittHeading : this.heading));
      if (headingDelta > 180) headingDelta -= 360;
      if (headingDelta < -180) headingDelta += 360;
      this._prevKittHeading = this.heading;
      const steerInertia = Math.max(-18, Math.min(18, -headingDelta * 2.2));
      this.sensorSteerTilt += (steerInertia - this.sensorSteerTilt) * 0.15;

      const totalTiltX = this.sensorTiltX + this.sensorSteerTilt;
      const totalTiltY = this.sensorTiltY;

      // Speed & Acceleration telemetry coupling
      const speed = Math.round(this.speedMph || 0);
      const accelDelta = speed - (this.lastSpeedMph !== undefined ? this.lastSpeedMph : speed);
      this.lastSpeedMph = speed;
      this.sensorAccel += (accelDelta - this.sensorAccel) * 0.16;

      const isAccelerating = this.sensorAccel > 0.4;
      const isBraking = this.sensorAccel < -0.4;
      const isSpm = speed >= 65;

      // Dedicated Square Module Bounds (1:1 Aspect Ratio anchored to square map bounds)
      const boardSize = Math.min(w, h) * 0.90;
      const boardRadius = boardSize * 0.47;

      // Perspective Projection Coordinate Helper for Multi-Layer Parallax
      const project = (nx, ny, zOffset) => {
        const px = cx + nx * boardRadius + totalTiltX * zOffset * this.dpr * 0.85;
        const py = cy + ny * boardRadius + totalTiltY * zOffset * this.dpr * 0.85;
        return { x: px, y: py };
      };

      ctx.clearRect(0, 0, w, h);

      // -------------------------------------------------------------
      // LAYER 0: Centered 1:1 Square Substrate & Silkscreen (Depth Z = -0.35)
      // -------------------------------------------------------------
      const subOffX = totalTiltX * -0.35 * this.dpr * 0.85;
      const subOffY = totalTiltY * -0.35 * this.dpr * 0.85;

      // Deep ambient canvas background
      ctx.fillStyle = '#020b05';
      ctx.fillRect(0, 0, w, h);

      // Centered 1:1 Square PCB Substrate Frame
      const boardLeft = cx - boardSize / 2 + subOffX;
      const boardTop = cy - boardSize / 2 + subOffY;
      const boardCornerR = 16 * this.dpr;

      // Deep automotive soldermask fiberglass background inside square board
      const pcbGrad = ctx.createLinearGradient(boardLeft, boardTop, boardLeft + boardSize, boardTop + boardSize);
      pcbGrad.addColorStop(0, '#03170b');
      pcbGrad.addColorStop(0.5, '#052210');
      pcbGrad.addColorStop(1, '#021006');

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 24 * this.dpr;
      ctx.shadowOffsetX = -totalTiltX * 0.6 * this.dpr;
      ctx.shadowOffsetY = -totalTiltY * 0.6 * this.dpr + 6 * this.dpr;

      ctx.fillStyle = pcbGrad;
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 2.0 * this.dpr;
      ctx.beginPath();
      ctx.roundRect(boardLeft, boardTop, boardSize, boardSize, boardCornerR);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Copper Ground Plane Hatch Patterns (Clean 45° diagonal grid inside the square board)
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(boardLeft, boardTop, boardSize, boardSize, boardCornerR);
      ctx.clip();
      ctx.strokeStyle = 'rgba(21, 128, 61, 0.08)';
      ctx.lineWidth = 1.0 * this.dpr;
      const hatchStep = 18 * this.dpr;
      for (let x = boardLeft - boardSize; x < boardLeft + boardSize * 2; x += hatchStep) {
        ctx.beginPath();
        ctx.moveTo(x, boardTop);
        ctx.lineTo(x + boardSize, boardTop + boardSize);
        ctx.stroke();
      }

      // Outer Silkscreen Alignment Frame inside square board
      const innerPad = 12 * this.dpr;
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.28)';
      ctx.lineWidth = 1.2 * this.dpr;
      ctx.strokeRect(boardLeft + innerPad, boardTop + innerPad, boardSize - innerPad * 2, boardSize - innerPad * 2);

      // Silkscreen Board Legend along bottom edge of square board
      ctx.font = `700 ${Math.round(8.5 * this.dpr)}px "Courier New", monospace`;
      ctx.fillStyle = 'rgba(74, 222, 128, 0.45)';
      ctx.textAlign = 'center';
      ctx.fillText('[ NOMAD SYNTHOMATIC SENSORY BUS // 16-BIT AUDIO DSP ]', cx + subOffX, boardTop + boardSize - innerPad - 6 * this.dpr);
      ctx.restore();

      // -------------------------------------------------------------
      // LAYER 1: Conductive Copper Traces & Solder Vias (Depth Z = 0.0)
      // -------------------------------------------------------------
      ctx.save();
      for (let i = 0; i < this.circuitTraces.length; i++) {
        const trace = this.circuitTraces[i];
        if (trace.pts.length < 2) continue;

        ctx.beginPath();
        const p0 = project(trace.pts[0].nx, trace.pts[0].ny, 0.0);
        ctx.moveTo(p0.x, p0.y);
        for (let j = 1; j < trace.pts.length; j++) {
          const pj = project(trace.pts[j].nx, trace.pts[j].ny, 0.0);
          ctx.lineTo(pj.x, pj.y);
        }

        // Trace glow & line styling
        let traceAlpha = trace.alpha;
        if (speed > 25) traceAlpha *= 1.35;
        if (isAccelerating) traceAlpha *= 1.6;
        if (isSpm) traceAlpha *= 1.8;

        ctx.lineWidth = trace.width * this.dpr;
        ctx.strokeStyle = trace.color;
        ctx.globalAlpha = Math.min(0.95, traceAlpha);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // High-energy core highlight for active lines
        if (isAccelerating || speed > 40) {
          ctx.lineWidth = Math.max(0.8, trace.width * 0.45) * this.dpr;
          ctx.strokeStyle = '#ffffff';
          ctx.globalAlpha = 0.25;
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1.0;

      // Annular Plated Through-Hole Vias with Realistic Metallic Specular Highlight
      const lightX = -totalTiltX / 35;
      const lightY = -totalTiltY / 30 - 0.5;
      const glintMag = Math.sqrt(lightX * lightX + lightY * lightY) || 1;
      const glintNormX = lightX / glintMag;
      const glintNormY = lightY / glintMag;

      for (let i = 0; i < this.pcbVias.length; i++) {
        const via = this.pcbVias[i];
        const vpt = project(via.nx, via.ny, 0.0);

        // Outer Gold Annular Ring
        ctx.beginPath();
        ctx.arc(vpt.x, vpt.y, via.radius * this.dpr, 0, Math.PI * 2);
        ctx.fillStyle = speed > 25 ? '#ffd700' : '#ca8a04';
        ctx.fill();

        // Outer Copper Rim
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 0.8 * this.dpr;
        ctx.stroke();

        // Shifting Metallic Specular Glint
        const glintX = vpt.x + glintNormX * (via.radius * 0.45 * this.dpr);
        const glintY = vpt.y + glintNormY * (via.radius * 0.45 * this.dpr);
        ctx.beginPath();
        ctx.arc(glintX, glintY, via.radius * 0.35 * this.dpr, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Central Dark Drill Hole
        ctx.beginPath();
        ctx.arc(vpt.x, vpt.y, via.holeRadius * this.dpr, 0, Math.PI * 2);
        ctx.fillStyle = '#020804';
        ctx.fill();
      }

      // Sensor Test Points (Gold Annular Pads with Silkscreen Crosshair & Legend)
      for (let i = 0; i < this.pcbTestPoints.length; i++) {
        const tp = this.pcbTestPoints[i];
        const tpt = project(tp.nx, tp.ny, 0.0);

        // Outer Glow
        ctx.beginPath();
        ctx.arc(tpt.x, tpt.y, 7.0 * this.dpr, 0, Math.PI * 2);
        ctx.fillStyle = tp.color;
        ctx.shadowColor = tp.color;
        ctx.shadowBlur = 8 * this.dpr;
        ctx.globalAlpha = 0.35;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;

        // Gold Test Pad Ring
        ctx.beginPath();
        ctx.arc(tpt.x, tpt.y, 4.5 * this.dpr, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd700';
        ctx.fill();

        // Center Probe Indent
        ctx.beginPath();
        ctx.arc(tpt.x, tpt.y, 1.8 * this.dpr, 0, Math.PI * 2);
        ctx.fillStyle = '#1e293b';
        ctx.fill();

        // Silkscreen Label
        ctx.font = `800 ${Math.round(8.5 * this.dpr)}px "Courier New", monospace`;
        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'center';
        ctx.fillText(tp.label, tpt.x, tpt.y - 8 * this.dpr);
        ctx.font = `700 ${Math.round(6.5 * this.dpr)}px "Courier New", monospace`;
        ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
        ctx.fillText(tp.sub, tpt.x, tpt.y + 11 * this.dpr);
      }
      ctx.restore();

      // -------------------------------------------------------------
      // LAYER 1.5: Kinetic Current & Signal Pulses (Conductive Data Packets)
      // -------------------------------------------------------------
      ctx.save();
      const packetSpeedMultiplier = 1.0 + (speed / 40) * 2.4 + (isAccelerating ? 1.0 : 0);

      // Helper to interpolate position along multi-segment trace
      const getTracePointAt = (trace, tNorm) => {
        const targetDist = ((tNorm % 1 + 1) % 1) * trace.totalLen;
        let accum = 0;
        for (let s = 0; s < trace.segLens.length; s++) {
          const segLen = trace.segLens[s];
          if (accum + segLen >= targetDist || s === trace.segLens.length - 1) {
            const segT = segLen > 0 ? (targetDist - accum) / segLen : 0;
            const p1 = trace.pts[s];
            const p2 = trace.pts[s + 1];
            const nx = p1.nx + (p2.nx - p1.nx) * segT;
            const ny = p1.ny + (p2.ny - p1.ny) * segT;
            return { nx, ny };
          }
          accum += segLen;
        }
        return trace.pts[trace.pts.length - 1];
      };

      for (let k = 0; k < this.dataPackets.length; k++) {
        const pkt = this.dataPackets[k];
        const trace = this.circuitTraces[pkt.traceIdx];
        if (!trace || trace.totalLen === 0) continue;

        // Progress packet along trace with telemetry coupling
        pkt.t = (pkt.t + pkt.baseSpeed * packetSpeedMultiplier) % 1.0;

        // Head point
        const headNorm = getTracePointAt(trace, pkt.t);
        const headPt = project(headNorm.nx, headNorm.ny, 0.0);

        // Fading tail segments along trace
        const numTailSegs = 4;
        for (let s = 1; s <= numTailSegs; s++) {
          const tailT = pkt.t - s * (pkt.trailLen / numTailSegs);
          const tailNorm = getTracePointAt(trace, tailT);
          const tailPt = project(tailNorm.nx, tailNorm.ny, 0.0);

          ctx.beginPath();
          ctx.arc(tailPt.x, tailPt.y, Math.max(0.8, (pkt.size - s * 0.35)) * this.dpr, 0, Math.PI * 2);
          ctx.fillStyle = pkt.color;
          ctx.globalAlpha = (1.0 - s / (numTailSegs + 1)) * 0.45;
          ctx.fill();
        }

        // Glowing Packet Head
        ctx.beginPath();
        ctx.arc(headPt.x, headPt.y, pkt.size * this.dpr, 0, Math.PI * 2);
        ctx.fillStyle = pkt.color;
        ctx.shadowColor = pkt.color;
        ctx.shadowBlur = (isAccelerating ? 12 : 6) * this.dpr;
        ctx.globalAlpha = 1.0;
        ctx.fill();

        // Hot White Core
        ctx.beginPath();
        ctx.arc(headPt.x, headPt.y, Math.max(0.8, pkt.size * 0.45) * this.dpr, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.restore();

      // Micro-display bezel dimensions (synchronized between QFP package, HUD layer, and regen braking)
      const boxW = Math.min(136 * this.dpr, boardSize * 0.44);
      const boxH = Math.min(114 * this.dpr, boardSize * 0.38);

      // Regenerative Braking Energy Dissipation Surge (Reverse Pulses from DSP)
      if (isBraking) {
        ctx.save();
        ctx.lineWidth = 3.0 * this.dpr;
        ctx.strokeStyle = '#f43f5e';
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 14 * this.dpr;
        ctx.globalAlpha = Math.min(0.8, Math.abs(this.sensorAccel) * 0.3);
        const pDsp = project(0.0, 0.0, 0.0);
        ctx.beginPath();
        ctx.arc(pDsp.x, pDsp.y, (boxW * 0.5 + 10 + (Date.now() % 400) * 0.08) * this.dpr, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // -------------------------------------------------------------
      // LAYER 2: SMT Hardware Components & ICs (Depth Z = +0.55)
      // -------------------------------------------------------------
      ctx.save();
      const icZ = 0.55;
      const compShadowOffX = -totalTiltX * 0.45 * this.dpr;
      const compShadowOffY = -totalTiltY * 0.45 * this.dpr + 3 * this.dpr;

      for (let i = 0; i < this.pcbComponents.length; i++) {
        const comp = this.pcbComponents[i];
        const cpt = project(comp.nx, comp.ny, icZ);
        let cw = comp.nw * boardRadius;
        let ch = comp.nh * boardRadius;
        if (comp.type === 'qfp') {
          // QFP package frame extends neatly around the embedded micro-display
          cw = boxW + 24 * this.dpr;
          ch = boxH + 20 * this.dpr;
        }
        const cx0 = cpt.x - cw / 2;
        const cy0 = cpt.y - ch / 2;

        if (comp.type === 'qfp') {
          // Central Microprocessor / DSP Chip (SYNTH-DSP 8800)
          // 1. Gull-wing solder pins (32 total QFP pins extending outward)
          const pinsPerSide = 8;
          ctx.fillStyle = '#e2e8f0';
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 0.6 * this.dpr;

          // Top and bottom pins
          for (let p = 0; p < pinsPerSide; p++) {
            const px = cx0 + (p + 1) * (cw / (pinsPerSide + 1));
            // Top pin
            ctx.fillRect(px - 1.5 * this.dpr, cy0 - 6 * this.dpr, 3 * this.dpr, 6 * this.dpr);
            // Bottom pin
            ctx.fillRect(px - 1.5 * this.dpr, cy0 + ch, 3 * this.dpr, 6 * this.dpr);
          }
          // Left and right pins (8 per side = 32 total QFP pins)
          for (let p = 0; p < 8; p++) {
            const py = cy0 + (p + 1) * (ch / (8 + 1));
            // Left pin
            ctx.fillRect(cx0 - 6 * this.dpr, py - 1.5 * this.dpr, 6 * this.dpr, 3 * this.dpr);
            // Right pin
            ctx.fillRect(cx0 + cw, py - 1.5 * this.dpr, 6 * this.dpr, 3 * this.dpr);
          }

          // 2. Chip Epoxy Package Body with Dynamic Drop Shadow
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
          ctx.shadowBlur = 12 * this.dpr;
          ctx.shadowOffsetX = compShadowOffX;
          ctx.shadowOffsetY = compShadowOffY;

          ctx.fillStyle = '#06120a';
          ctx.strokeStyle = '#1b3b27';
          ctx.lineWidth = 1.6 * this.dpr;
          ctx.beginPath();
          ctx.roundRect(cx0, cy0, cw, ch, 6 * this.dpr);
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          // Pin 1 Index Dot (Chamfered Top-Left outside display perimeter)
          ctx.beginPath();
          ctx.arc(cx0 + 7 * this.dpr, cy0 + 7 * this.dpr, 2.2 * this.dpr, 0, Math.PI * 2);
          ctx.fillStyle = '#eab308';
          ctx.fill();

        } else if (comp.type === 'soic') {
          // SOIC-8 Sound ROM / Memory Chip
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
          ctx.shadowBlur = 8 * this.dpr;
          ctx.shadowOffsetX = compShadowOffX;
          ctx.shadowOffsetY = compShadowOffY;

          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1.2 * this.dpr;
          ctx.beginPath();
          ctx.roundRect(cx0, cy0, cw, ch, 4 * this.dpr);
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          // 8 Gull-wing pins
          ctx.fillStyle = '#e2e8f0';
          for (let p = 0; p < 4; p++) {
            const py = cy0 + (p + 0.5) * (ch / 4);
            ctx.fillRect(cx0 - 4 * this.dpr, py - 1.2 * this.dpr, 4 * this.dpr, 2.4 * this.dpr);
            ctx.fillRect(cx0 + cw, py - 1.2 * this.dpr, 4 * this.dpr, 2.4 * this.dpr);
          }

          ctx.font = `800 ${Math.round(7.5 * this.dpr)}px "Courier New", monospace`;
          ctx.fillStyle = '#e2e8f0';
          ctx.textAlign = 'center';
          ctx.fillText(comp.name, cpt.x, cpt.y + 2.5 * this.dpr);

        } else if (comp.type === 'crystal') {
          // Quartz Crystal Oscillator Can (Brushed Metallic Aluminum)
          ctx.save();
          ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
          ctx.shadowBlur = 8 * this.dpr;
          ctx.shadowOffsetX = compShadowOffX;
          ctx.shadowOffsetY = compShadowOffY;

          const crGrad = ctx.createLinearGradient(cx0, cy0, cx0, cy0 + ch);
          crGrad.addColorStop(0, '#94a3b8');
          crGrad.addColorStop(0.5, '#e2e8f0');
          crGrad.addColorStop(1, '#64748b');
          ctx.fillStyle = crGrad;
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1.2 * this.dpr;
          ctx.beginPath();
          ctx.roundRect(cx0, cy0, cw, ch, ch / 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          // Silver Solder End Pads
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(cx0 - 3 * this.dpr, cy0 + ch * 0.2, 3 * this.dpr, ch * 0.6);
          ctx.fillRect(cx0 + cw, cy0 + ch * 0.2, 3 * this.dpr, ch * 0.6);

          ctx.font = `800 ${Math.round(7.5 * this.dpr)}px "Courier New", monospace`;
          ctx.fillStyle = '#0f172a';
          ctx.textAlign = 'center';
          ctx.fillText(comp.name, cpt.x, cpt.y + 2.5 * this.dpr);
        }
      }
      ctx.restore();

      // -------------------------------------------------------------
      // HYPER-DRIVE (S.P.M.) WARP RAYS (Radial bursts from CPU)
      // -------------------------------------------------------------
      if (isSpm) {
        this.spmPhase += 0.08;
        ctx.save();
        ctx.lineWidth = 2.0 * this.dpr;
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2 + this.spmPhase * 0.15;
          const dist1 = 60 * this.dpr + ((this.spmPhase * 70 + i * 20) % (Math.max(w, h) * 0.6));
          const dist2 = dist1 + 50 * this.dpr;
          const x1 = cx + Math.cos(angle) * dist1;
          const y1 = cy + Math.sin(angle) * dist1;
          const x2 = cx + Math.cos(angle) * dist2;
          const y2 = cy + Math.sin(angle) * dist2;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = `rgba(255, 234, 0, ${0.18 + Math.sin(this.spmPhase + i) * 0.1})`;
          ctx.stroke();
        }
        ctx.restore();
      }

      // -------------------------------------------------------------
      // LAYER 3: Floating Cyber Orbit HUD Equalizer Bezel (Depth Z = +1.15)
      // -------------------------------------------------------------
      this.kittCadencePhase += 0.08 + (speed > 25 ? 0.05 : 0);
      const rawVoice = Math.pow(Math.abs(Math.sin(this.kittCadencePhase * 2.5) * Math.cos(this.kittCadencePhase * 1.3)), 1.5);
      const amp = Math.max(0.15, Math.min(1.0, rawVoice + (speed > 0 ? 0.25 : 0.08)));

      const targetLevels = [
        amp * (0.75 + Math.sin(this.kittCadencePhase * 3) * 0.2),
        amp,
        amp * (0.75 + Math.cos(this.kittCadencePhase * 3) * 0.2)
      ];

      for (let c = 0; c < 3; c++) {
        this.kittVoiceLevels[c] += (targetLevels[c] - this.kittVoiceLevels[c]) * 0.35;
      }

      ctx.save();
      const hudZ = 0.65;
      const hudCenterX = cx + totalTiltX * hudZ * this.dpr * 0.85;
      const hudCenterY = cy + totalTiltY * hudZ * this.dpr * 0.85;

      // Precision Cyber Micro-Display Bezel (Embedded over central DSP package)
      const boxX = hudCenterX - boxW / 2;
      const boxY = hudCenterY - boxH / 2;
      const cornerR = 7 * this.dpr;

      // Compass responsive orbital traveling speed & direction
      const turnVel = (this.heading - (this._prevHeading || this.heading));
      this._prevHeading = this.heading;
      let travelDir = 1;
      if (turnVel < -0.2) travelDir = -1;
      else if (turnVel > 0.2) travelDir = 1;

      const orbitSpeed = (0.005 + Math.min(0.015, speed * 0.0003) + Math.abs(turnVel) * 0.002) * travelDir;
      this.kittScannerPos = ((this.kittScannerPos + orbitSpeed) % 1 + 1) % 1;

      // Floating Bezel Soft Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
      ctx.shadowBlur = 14 * this.dpr;
      ctx.shadowOffsetX = -totalTiltX * 0.5 * this.dpr;
      ctx.shadowOffsetY = -totalTiltY * 0.5 * this.dpr + 4 * this.dpr;

      // Background Bezel Housing (Subtle dark emerald glass)
      const dispGrad = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxH);
      dispGrad.addColorStop(0, 'rgba(4, 18, 10, 0.88)');
      dispGrad.addColorStop(1, 'rgba(2, 10, 6, 0.94)');
      ctx.fillStyle = dispGrad;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, cornerR);
      ctx.fill();

      // Glowing Rim Bezel
      const activeThemeColor = isSpm ? '#ffd700' : (isAccelerating ? '#f59e0b' : (speed > 25 ? '#ff3344' : '#22c55e'));
      ctx.shadowColor = activeThemeColor;
      ctx.shadowBlur = 10 * this.dpr;
      ctx.strokeStyle = activeThemeColor;
      ctx.lineWidth = 1.4 * this.dpr;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Traveling Halo Beads around the rounded rectangle frame
      const numBeads = 20;
      for (let b = 0; b < numBeads; b++) {
        const beadT = b / numBeads;
        let diff = Math.abs(beadT - this.kittScannerPos);
        if (diff > 0.5) diff = 1.0 - diff;

        const beadPt = this._getRoundedRectPt(beadT, boxX, boxY, boxW, boxH, cornerR);

        if (diff < 0.14) {
          const intensity = 1.0 - (diff / 0.14);
          ctx.beginPath();
          ctx.arc(beadPt.x, beadPt.y, 2.4 * this.dpr, 0, Math.PI * 2);
          ctx.fillStyle = activeThemeColor;
          ctx.shadowColor = activeThemeColor;
          ctx.shadowBlur = intensity * 8 * this.dpr;
          ctx.fill();

          if (intensity > 0.7) {
            ctx.beginPath();
            ctx.arc(beadPt.x, beadPt.y, 1.2 * this.dpr, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
          }
          ctx.shadowBlur = 0;
        } else {
          ctx.beginPath();
          ctx.arc(beadPt.x, beadPt.y, 1.0 * this.dpr, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(34, 197, 94, 0.22)';
          ctx.fill();
        }
      }

      // Title header
      ctx.font = `900 ${Math.round(9.5 * this.dpr)}px "Courier New", monospace`;
      ctx.fillStyle = activeThemeColor;
      ctx.shadowColor = activeThemeColor;
      ctx.shadowBlur = 6 * this.dpr;
      ctx.textAlign = 'center';
      ctx.fillText('SYNTHOMATIC', hudCenterX, boxY + 14 * this.dpr);
      ctx.shadowBlur = 0;

      // 3 Columns: Left, Center, Right Equalizer
      const numCols = 3;
      const colWidth = (boxW - 28 * this.dpr) / numCols;
      const colGap = 5 * this.dpr;
      const leftStartX = hudCenterX - (numCols * colWidth + (numCols - 1) * colGap) / 2;

      const segmentsPerCol = [8, 10, 8];
      const segH = 3.0 * this.dpr;
      const segG = 1.5 * this.dpr;

      for (let c = 0; c < numCols; c++) {
        const colX = leftStartX + c * (colWidth + colGap);
        const totalSegs = segmentsPerCol[c];
        const activeCount = Math.round(this.kittVoiceLevels[c] * (totalSegs / 2));
        const midIndex = totalSegs / 2;

        const colTotalHeight = totalSegs * segH + (totalSegs - 1) * segG;
        const colStartY = boxY + 20 * this.dpr + (boxH - 52 * this.dpr - colTotalHeight) / 2;

        for (let s = 0; s < totalSegs; s++) {
          const sy = colStartY + s * (segH + segG);
          const distFromMid = Math.abs(s - (midIndex - 0.5));
          const isActive = distFromMid < activeCount;

          if (isActive) {
            ctx.fillStyle = activeThemeColor;
            ctx.shadowColor = activeThemeColor;
            ctx.shadowBlur = 8 * this.dpr;
            ctx.fillRect(colX, sy, colWidth, segH);

            // Core Hot White Center
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(colX + 3 * this.dpr, sy + 1 * this.dpr, colWidth - 6 * this.dpr, segH - 2 * this.dpr);
            ctx.shadowBlur = 0;
          } else {
            ctx.fillStyle = 'rgba(15, 45, 25, 0.40)';
            ctx.fillRect(colX, sy, colWidth, segH);
          }
        }
      }

      // Footer state label
      let stateLabel = 'STANDBY';
      let stateColor = '#22c55e';
      if (speed > 64) { stateLabel = 'HYPER-DRIVE'; stateColor = '#ffd700'; }
      else if (isAccelerating) { stateLabel = 'CURRENT SURGE'; stateColor = '#f59e0b'; }
      else if (isBraking) { stateLabel = 'REGEN BRAKING'; stateColor = '#38bdf8'; }
      else if (speed > 25) { stateLabel = 'PURSUIT MODE'; stateColor = '#ff3344'; }
      else if (speed > 0) { stateLabel = 'CRUISE VECTOR'; stateColor = '#eab308'; }

      ctx.font = `900 ${Math.round(8.5 * this.dpr)}px "Courier New", monospace`;
      ctx.fillStyle = stateColor;
      ctx.shadowColor = stateColor;
      ctx.shadowBlur = 5 * this.dpr;
      ctx.textAlign = 'center';
      ctx.fillText(stateLabel, hudCenterX, boxY + boxH - 19 * this.dpr);
      ctx.shadowBlur = 0;

      // Real-Time Sensor Telemetry HUD Footer (Gyro Tilt & Accel Coupling)
      ctx.font = `700 ${Math.round(6.8 * this.dpr)}px "Courier New", monospace`;
      ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
      ctx.textAlign = 'center';
      const tiltXDeg = Math.round(totalTiltX);
      const tiltYDeg = Math.round(totalTiltY);
      ctx.fillText(`IMU TILT: X:${tiltXDeg > 0 ? '+' : ''}${tiltXDeg}° Y:${tiltYDeg > 0 ? '+' : ''}${tiltYDeg}° // ${speed} MPH`, hudCenterX, boxY + boxH - 8 * this.dpr);

      ctx.restore();

      // Ripples
      this._renderRipples(ctx);
    }

    _renderStampedeMode() {
      const ctx = this.ctx;
      const w = this.canvas.width;
      const h = this.canvas.height;
      const cx = this.centerX;
      const cy = this.centerY;
      const speed = this.speedMph || 0;
      const isStopped = speed < 0.5;

      ctx.clearRect(0, 0, w, h);

      // 1. Animation phase & Kinetic Sensor Physics progression
      const gallopRate = isStopped ? 0.015 : (0.08 + Math.min(0.24, speed * 0.004));
      this.stampedePhase += gallopRate;

      // Smooth sensor tilt tracking
      this.sensorTiltX += (this.targetTiltX - this.sensorTiltX) * 0.14;

      // Heading steering delta (rotational momentum)
      let headingDelta = (this.heading - this.lastHeading);
      if (headingDelta > 180) headingDelta -= 360;
      if (headingDelta < -180) headingDelta += 360;
      this.lastHeading = this.heading;

      // Combined kinetic sway angle from device tilt, steering turns, touch drag, and speed wind gusts
      const windGust = Math.sin(this.stampedePhase * 0.7) * 0.06 + Math.sin(this.stampedePhase * 1.6) * 0.03;
      const turnSway = Math.max(-0.25, Math.min(0.25, -headingDelta * 0.03));
      const tiltSway = (this.sensorTiltX / 35) * 0.22;
      const dragSway = this.angularVelocity * 0.22;
      const speedBreeze = (speed / 80) * 0.06;
      this.swayAngle = tiltSway + windGust + turnSway + dragSway + speedBreeze;

      const horizonY = cy * 0.76;

      // 2. Scenic Night-Time Atmosphere (Midnight Obsidian to Deep Indigo Horizon)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, '#04010a');    // Midnight obsidian zenith
      skyGrad.addColorStop(0.35, '#0c0517'); // Deep celestial indigo
      skyGrad.addColorStop(0.72, '#190d28'); // Starlit canyon twilight
      skyGrad.addColorStop(1, '#2c1538');    // Moonlit atmospheric horizon
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, horizonY + 2);

      // Twinkling Canyon Night Stars
      if (this.stampedeStars) {
        ctx.save();
        for (let star of this.stampedeStars) {
          star.phase += star.twinkleSpeed;
          const alpha = 0.35 + Math.sin(star.phase) * 0.45;
          ctx.fillStyle = star.colorVar;
          ctx.globalAlpha = Math.max(0.12, Math.min(1.0, alpha));
          ctx.beginPath();
          ctx.arc(star.x * w, star.y * horizonY * 0.95, star.size * this.dpr, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Glowing Silver Crescent Moon with Soft Luminous Halo
      this._drawCrescentMoon(ctx, cx + w * 0.28, horizonY * 0.34, 16 * this.dpr);

      // Slowly Moving Canyon Twilight Clouds
      if (this.stampedeClouds) {
        ctx.save();
        for (let cloud of this.stampedeClouds) {
          cloud.x += cloud.speed;
          if (cloud.x > 1.35) cloud.x = -0.35;

          const cloudX = cloud.x * w;
          const cloudY = cloud.y * horizonY;
          const baseR = cloud.width * 0.28 * this.dpr;

          ctx.save();
          ctx.translate(cloudX, cloudY);
          ctx.globalAlpha = cloud.opacity;

          for (let p of cloud.puffs) {
            const px = p.ox * cloud.width * this.dpr;
            const py = p.oy * cloud.width * 0.35 * this.dpr;
            const pr = baseR * p.r;

            const cg = ctx.createRadialGradient(px, py, pr * 0.1, px, py, pr);
            cg.addColorStop(0, 'rgba(218, 198, 238, 0.42)');
            cg.addColorStop(0.65, 'rgba(135, 110, 170, 0.20)');
            cg.addColorStop(1, 'rgba(40, 20, 60, 0)');

            ctx.fillStyle = cg;
            ctx.beginPath();
            ctx.arc(px, py, pr, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
        ctx.restore();
      }

      // 3. Distant Ark Vessel Silhouette & Horizon Beacon Light
      this._drawArkVessel(ctx, cx, horizonY);

      // Distant Dark Mesa & Canyon Ridge Silhouettes
      ctx.save();
      // Back Mesa Layer (Far)
      ctx.fillStyle = '#170b22';
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(w * 0.12, horizonY - 28 * this.dpr);
      ctx.lineTo(w * 0.26, horizonY - 28 * this.dpr);
      ctx.lineTo(w * 0.38, horizonY);
      ctx.lineTo(w * 0.62, horizonY);
      ctx.lineTo(w * 0.74, horizonY - 22 * this.dpr);
      ctx.lineTo(w * 0.88, horizonY - 22 * this.dpr);
      ctx.lineTo(w, horizonY);
      ctx.lineTo(w, horizonY + 10);
      ctx.lineTo(0, horizonY + 10);
      ctx.closePath();
      ctx.fill();

      // Front Canyon Rim Layer (Closer)
      ctx.fillStyle = '#0f0616';
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(w * 0.08, horizonY - 14 * this.dpr);
      ctx.lineTo(w * 0.20, horizonY - 17 * this.dpr);
      ctx.lineTo(w * 0.44, horizonY);
      ctx.lineTo(w * 0.58, horizonY);
      ctx.lineTo(w * 0.78, horizonY - 18 * this.dpr);
      ctx.lineTo(w * 0.94, horizonY - 10 * this.dpr);
      ctx.lineTo(w, horizonY);
      ctx.lineTo(w, horizonY + 10);
      ctx.lineTo(0, horizonY + 10);
      ctx.closePath();
      ctx.fill();

      // Mesa rim silver starlight highlight
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.25)';
      ctx.lineWidth = 1.0 * this.dpr;
      ctx.stroke();
      ctx.restore();

      // Soaring Night Eagles in the Sky
      if (this.stampedeEagles) {
        for (let eagle of this.stampedeEagles) {
          eagle.angle += eagle.speed;
          const ex = cx + Math.cos(eagle.angle) * (w * eagle.radiusX);
          const ey = (horizonY * eagle.height) + Math.sin(eagle.angle) * (horizonY * eagle.radiusY);
          const bankAngle = Math.cos(eagle.angle) * 0.25 * (eagle.speed > 0 ? 1 : -1) + (this.swayAngle * 0.3);
          this._drawEagle(ctx, ex, ey, eagle.wingSpan * this.dpr, bankAngle);
        }
      }

      // 4. Brightened Prairie Floor & Illuminated Roadway
      // Brightened warm sandstone & moonlit amber prairie ground (high contrast against dark animals)
      const groundGrad = ctx.createLinearGradient(0, horizonY, 0, h);
      groundGrad.addColorStop(0, '#583119');    // Canyon horizon base
      groundGrad.addColorStop(0.2, '#884a24');   // Moonlit sandstone slope
      groundGrad.addColorStop(0.55, '#bd763d');  // Brightened amber prairie
      groundGrad.addColorStop(1, '#db965c');    // Bright warm foreground
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, horizonY, w, h - horizonY);

      // Brightened Center Canyon Road / Highway Ribbon
      ctx.save();
      const roadTopW = w * 0.14;
      const roadBotW = w * 0.78;
      const roadGrad = ctx.createLinearGradient(0, horizonY, 0, h);
      roadGrad.addColorStop(0, '#d2965c');
      roadGrad.addColorStop(0.25, '#ebb179');
      roadGrad.addColorStop(0.65, '#fad5a4'); // Luminous bright sandstone roadway
      roadGrad.addColorStop(1, '#ffe3be');   // Luminous bright highway glow
      ctx.fillStyle = roadGrad;
      ctx.beginPath();
      ctx.moveTo(cx - roadTopW * 0.5, horizonY);
      ctx.lineTo(cx + roadTopW * 0.5, horizonY);
      ctx.lineTo(cx + roadBotW * 0.5, h);
      ctx.lineTo(cx - roadBotW * 0.5, h);
      ctx.closePath();
      ctx.fill();

      // Road edge bright boundary lines
      ctx.strokeStyle = 'rgba(255, 245, 220, 0.6)';
      ctx.lineWidth = 1.6 * this.dpr;
      ctx.beginPath();
      ctx.moveTo(cx - roadTopW * 0.5, horizonY);
      ctx.lineTo(cx - roadBotW * 0.5, h);
      ctx.moveTo(cx + roadTopW * 0.5, horizonY);
      ctx.lineTo(cx + roadBotW * 0.5, h);
      ctx.stroke();

      // Subtle curved tyre ruts for depth
      ctx.strokeStyle = 'rgba(175, 95, 45, 0.24)';
      ctx.lineWidth = 3.5 * this.dpr;
      ctx.beginPath();
      ctx.moveTo(cx - roadTopW * 0.22, horizonY);
      ctx.lineTo(cx - roadBotW * 0.24, h);
      ctx.moveTo(cx + roadTopW * 0.22, horizonY);
      ctx.lineTo(cx + roadBotW * 0.24, h);
      ctx.stroke();
      ctx.restore();

      // Prairie contour lines (Brightened warm strokes)
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 230, 190, 0.22)';
      ctx.lineWidth = 1.0 * this.dpr;
      for (let line = 0; line < 4; line++) {
        const ly = horizonY + (h - horizonY) * (0.22 + line * 0.24);
        ctx.beginPath();
        ctx.moveTo(0, ly);
        for (let lx = 0; lx < w; lx += 28 * this.dpr) {
          const wave = Math.sin(lx * 0.03 + line * 1.5) * 3 * this.dpr;
          ctx.lineTo(lx, ly + wave);
        }
        ctx.stroke();
      }
      ctx.restore();

      // 5. Combined Z-Sorted 3D Rendering: Trees, Saguaro Cacti, Grass Tufts, and Wildlife Herd
      // Build render queue for accurate perspective depth layering (z: 0.08 far -> 1.0 near)
      const renderQueue = [];

      // Add Flora (Trees & Giant Saguaro Cacti)
      if (this.stampedeFlora) {
        for (let flora of this.stampedeFlora) {
          renderQueue.push({ type: 'flora', z: flora.z, data: flora });
        }
      }

      // Add Grass Tufts
      if (this.stampedeGrassTufts) {
        for (let tuft of this.stampedeGrassTufts) {
          renderQueue.push({ type: 'grass', z: tuft.z, data: tuft });
        }
      }

      // Add Wildlife Animals (Staggered herd running away towards the vanishing horizon)
      if (this.stampedeAnimals) {
        const herdThrust = isStopped ? 0.0018 : (0.0036 + (speed / 80) * 0.020);
        for (let animal of this.stampedeAnimals) {
          if (!animal.active) {
            animal.spawnTimer--;
            if (animal.spawnTimer <= 0) {
              this._respawnAnimal(animal);
            }
            continue;
          }

          // Advance towards the vanishing horizon (Z decreases)
          animal.z -= herdThrust * animal.speedOffset;
          animal.gallopPhase += gallopRate * animal.speedOffset;

          // Natural prairie wandering along drift vector
          animal.x += (animal.driftX || 0);
          if (animal.x > 0.82) {
            animal.driftX = -Math.abs(animal.driftX || 0.002);
            animal.facing = 1;
          } else if (animal.x < -0.82) {
            animal.driftX = Math.abs(animal.driftX || 0.002);
            animal.facing = -1;
          }

          if (animal.species === 'snake') {
            animal.slitherPhase += isStopped ? 0.08 : (0.15 + Math.min(0.28, speed * 0.006));
          }

          // Vanishing point over the horizon mesa rim
          if (animal.z <= 0.07) {
            animal.active = false;
            animal.spawnTimer = Math.floor(Math.random() * 110 + 40); // 0.7s to 2.5s staggered cooldown
            continue;
          }

          renderQueue.push({ type: 'animal', z: Math.max(0.07, Math.min(1.04, animal.z)), data: animal });
        }
      }

      // Sort entire scene by depth (Z far to near)
      renderQueue.sort((a, b) => a.z - b.z);

      // Render items in depth order
      for (let item of renderQueue) {
        const pz = item.z;
        const groundSpread = (h - horizonY);
        const iy = horizonY + Math.pow(pz, 1.35) * groundSpread;

        if (item.type === 'flora') {
          const flora = item.data;
          const trackWidth = (w * 0.16) + pz * (w * 0.92);
          const tx = cx + (flora.side * flora.xOffset * trackWidth * 0.5);
          const fScale = (0.25 + Math.pow(pz, 1.4) * 0.95) * this.dpr;
          if (flora.type === 'cactus') {
            this._drawSaguaroCactus(ctx, tx, iy, fScale, flora, this.swayAngle);
          } else {
            this._drawSwayingTree(ctx, tx, iy, fScale, flora, this.swayAngle);
          }
        } else if (item.type === 'grass') {
          const tuft = item.data;
          const trackW = (w * 0.15) + pz * (w * 0.85);
          const gx = cx + tuft.x * trackW * 0.5;
          const gh = tuft.height * pz * this.dpr;
          this._drawSwayingGrass(ctx, gx, iy, gh, tuft, this.swayAngle);
        } else if (item.type === 'animal') {
          const animal = item.data;
          const trackWidth = (w * 0.12) + pz * (w * 0.82);
          const ax = cx + (animal.x * trackWidth * 0.5);
          // Enlarged base scale for enhanced presence & crisp anatomical silhouette
          const scale = (0.30 + Math.pow(pz, 1.35) * 1.42) * animal.size * this.dpr;

          let bounce = 0;
          if (animal.species === 'snake') {
            bounce = 0;
          } else {
            bounce = Math.abs(Math.sin(animal.gallopPhase)) * 8 * scale;
          }

          // Trailing dust particles kicked backward as animal surges towards horizon
          if (pz > 0.25 && Math.random() < 0.35) {
            this.stampedeDust.push({
              x: ax + (Math.random() - 0.5) * 18 * scale,
              y: iy - bounce + 4 * scale,
              z: pz,
              size: (Math.random() * 9 + 5) * scale,
              alpha: 0.40 * pz,
              vx: (Math.random() - 0.5) * 1.2,
              vy: Math.random() * 0.9 + 0.2, // Puffs backward/downward as hooves push forward
              life: 45
            });
          }

          this._drawWildlifeAnimal(ctx, ax, iy - bounce, scale, pz, animal, isStopped, speed);
        }
      }

      // 6. Dust Storm & Wind Motes Simulation
      for (let i = this.stampedeDust.length - 1; i >= 0; i--) {
        const d = this.stampedeDust[i];
        d.x += d.vx + this.swayAngle * 1.8;
        d.y += d.vy;
        d.size += 0.35 * this.dpr;
        d.alpha *= 0.96;
        d.life--;

        if (d.alpha < 0.01 || d.life <= 0) {
          this.stampedeDust.splice(i, 1);
          continue;
        }

        ctx.save();
        const dustGrad = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.size);
        dustGrad.addColorStop(0, `rgba(255, 215, 150, ${d.alpha})`);
        dustGrad.addColorStop(0.6, `rgba(215, 140, 70, ${d.alpha * 0.5})`);
        dustGrad.addColorStop(1, 'rgba(120, 60, 20, 0)');
        ctx.fillStyle = dustGrad;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Replenish ambient dust motes
      if (this.stampedeDust.length < (isStopped ? 25 : 60)) {
        this.stampedeDust.push({
          x: cx + (Math.random() - 0.5) * w * 1.1,
          y: horizonY + Math.random() * (h - horizonY),
          z: Math.random() * 0.8 + 0.2,
          size: Math.random() * 12 + 6,
          alpha: isStopped ? 0.12 : 0.25,
          vx: (Math.random() - 0.5) * 0.6,
          vy: -Math.random() * 0.4 - 0.1,
          life: 70
        });
      }

      // 7. Interactive touch ripples
      this._renderRipples(ctx);
    }

    _drawCrescentMoon(ctx, x, y, radius) {
      ctx.save();
      // Soft outer moonlit glow
      const glowGrad = ctx.createRadialGradient(x, y, radius * 0.4, x, y, radius * 2.8);
      glowGrad.addColorStop(0, 'rgba(240, 246, 255, 0.45)');
      glowGrad.addColorStop(0.4, 'rgba(186, 230, 253, 0.18)');
      glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(x, y, radius * 2.8, 0, Math.PI * 2);
      ctx.fill();

      // Silver Crescent Moon Disc
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Shadow cutout creating glowing crescent
      ctx.fillStyle = '#0e0618';
      ctx.beginPath();
      ctx.arc(x + radius * 0.55, y - radius * 0.2, radius * 0.85, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    _drawSwayingTree(ctx, x, y, scale, tree, swayAngle) {
      ctx.save();
      ctx.translate(x, y);

      const flexSway = swayAngle * tree.flexibility;
      const th = tree.height * scale;
      const tw = tree.width * scale;

      // Dark silhouette foliage color with depth
      const alpha = Math.min(1.0, 0.45 + tree.z * 0.55);
      const isPine = tree.treeType === 'pine' || tree.treeType === 'cypress';
      const treeColor = isPine ? `rgba(14, 28, 18, ${alpha})` : `rgba(22, 18, 12, ${alpha})`;
      const trunkColor = `rgba(28, 15, 8, ${alpha})`;

      // 1. Trunk with kinetic curvature
      ctx.beginPath();
      ctx.strokeStyle = trunkColor;
      ctx.lineWidth = Math.max(1.5 * this.dpr, 3.5 * scale);
      ctx.moveTo(0, 0);
      const midSway = flexSway * 12 * scale;
      const tipSway = flexSway * 26 * scale;
      ctx.quadraticCurveTo(midSway, -th * 0.5, tipSway, -th);
      ctx.stroke();

      // 2. Foliage Boughs (Pines, Junipers, Acacias)
      ctx.fillStyle = treeColor;
      ctx.strokeStyle = `rgba(186, 230, 253, ${0.15 * tree.z})`;
      ctx.lineWidth = 0.8 * this.dpr;

      if (isPine) {
        // Multi-tiered evergreen pine boughs
        const tiers = 3;
        for (let t = 0; t < tiers; t++) {
          const tierY = -th * (0.35 + t * 0.28);
          const tierW = tw * (1.0 - t * 0.25);
          const tierH = th * 0.32;
          const tierSway = flexSway * (10 + t * 6) * scale;

          ctx.beginPath();
          ctx.moveTo(tierSway, tierY - tierH);
          ctx.lineTo(tierSway + tierW * 0.5, tierY);
          ctx.quadraticCurveTo(tierSway, tierY - 2 * scale, tierSway - tierW * 0.5, tierY);
          ctx.closePath();
          ctx.fill();
          if (tree.z > 0.4) ctx.stroke();
        }
      } else {
        // Broad desert juniper / acacia canopy clusters
        const clusters = [
          { ox: 0, oy: -th * 0.88, r: tw * 0.45, s: 1.0 },
          { ox: -tw * 0.35, oy: -th * 0.68, r: tw * 0.38, s: 0.8 },
          { ox: tw * 0.35, oy: -th * 0.68, r: tw * 0.38, s: 0.8 },
          { ox: 0, oy: -th * 0.55, r: tw * 0.48, s: 0.6 }
        ];

        for (let c of clusters) {
          const cSway = flexSway * (15 * c.s) * scale;
          ctx.beginPath();
          ctx.arc(c.ox + cSway, c.oy, c.r, 0, Math.PI * 2);
          ctx.fill();
          if (tree.z > 0.4) ctx.stroke();
        }
      }

      ctx.restore();
    }

    _drawSwayingGrass(ctx, x, y, height, tuft, swayAngle) {
      ctx.save();
      const alpha = Math.min(0.9, 0.28 + tuft.z * 0.65);
      ctx.strokeStyle = `rgba(55, 30, 14, ${alpha})`;
      ctx.lineWidth = Math.max(1.0 * this.dpr, 1.6 * tuft.z * this.dpr);

      for (let b = 0; b < tuft.blades; b++) {
        const bladeSpread = (b - tuft.blades / 2) * 2.5 * this.dpr;
        const bladeSway = (swayAngle * 18 * this.dpr) + Math.sin(this.stampedePhase * 1.5 + tuft.swayOffset + b * 0.4) * 3 * this.dpr;

        ctx.beginPath();
        ctx.moveTo(x + bladeSpread * 0.3, y);
        ctx.quadraticCurveTo(
          x + bladeSpread + bladeSway * 0.5,
          y - height * 0.55,
          x + bladeSpread * 1.6 + bladeSway,
          y - height
        );
        ctx.stroke();
      }
      ctx.restore();
    }

    _drawEagle(ctx, x, y, span, bankAngle) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(bankAngle);

      // 1. Feathered Wings (Lighter Warm Desert Amber / Golden Brown)
      ctx.fillStyle = 'rgba(196, 142, 85, 0.95)';
      ctx.beginPath();
      ctx.moveTo(-span * 0.95, -span * 0.08);
      ctx.quadraticCurveTo(-span * 0.42, -span * 0.38, 0, -span * 0.12);
      ctx.quadraticCurveTo(span * 0.42, -span * 0.38, span * 0.95, -span * 0.08);
      ctx.quadraticCurveTo(span * 0.52, span * 0.18, 0, span * 0.06);
      ctx.quadraticCurveTo(-span * 0.52, span * 0.18, -span * 0.95, -span * 0.08);
      ctx.fill();

      // Wing Upper Covert Feather Highlights (Warm amber gold)
      ctx.fillStyle = 'rgba(235, 185, 125, 0.85)';
      ctx.beginPath();
      ctx.moveTo(-span * 0.7, -span * 0.1);
      ctx.quadraticCurveTo(-span * 0.35, -span * 0.3, 0, -span * 0.1);
      ctx.quadraticCurveTo(span * 0.35, -span * 0.3, span * 0.7, -span * 0.1);
      ctx.quadraticCurveTo(span * 0.35, span * 0.04, 0, span * 0.02);
      ctx.quadraticCurveTo(-span * 0.35, span * 0.04, -span * 0.7, -span * 0.1);
      ctx.fill();

      // Wingtip primary feathers rim (Bright golden crest)
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.75)';
      ctx.lineWidth = 1.2 * this.dpr;
      ctx.stroke();

      // 2. Eagle Body (Rich Amber Tawny)
      ctx.fillStyle = 'rgba(160, 105, 55, 0.96)';
      ctx.beginPath();
      ctx.ellipse(0, 0, span * 0.16, span * 0.36, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3. Iconic White/Golden Crown & Tail Feathers (Bald / Golden Eagle markings)
      // Head Crown
      ctx.fillStyle = 'rgba(255, 250, 240, 0.96)';
      ctx.beginPath();
      ctx.ellipse(0, -span * 0.28, span * 0.10, span * 0.14, 0, 0, Math.PI * 2);
      ctx.fill();

      // Beak (Warm Golden Yellow)
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(-span * 0.04, -span * 0.38);
      ctx.lineTo(span * 0.04, -span * 0.38);
      ctx.lineTo(0, -span * 0.48);
      ctx.closePath();
      ctx.fill();

      // White Fan Tail
      ctx.fillStyle = 'rgba(255, 250, 240, 0.92)';
      ctx.beginPath();
      ctx.moveTo(-span * 0.12, span * 0.28);
      ctx.lineTo(span * 0.12, span * 0.28);
      ctx.lineTo(span * 0.18, span * 0.46);
      ctx.lineTo(-span * 0.18, span * 0.46);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    _respawnAnimal(animal) {
      const allSpecies = ['bison', 'mustang', 'pronghorn', 'elk', 'ram', 'giraffe', 'snake'];
      animal.species = allSpecies[Math.floor(Math.random() * allSpecies.length)];
      animal.active = true;
      animal.z = 1.04; // Enters smoothly from the foreground
      animal.x = (Math.random() - 0.5) * 1.45;
      const drift = (Math.random() - 0.5) * 0.0028;
      animal.driftX = drift;
      animal.facing = drift >= 0 ? -1 : 1; // Aligned with stride drift direction
      animal.speedOffset = Math.random() * 0.28 + 0.86;
      animal.gallopPhase = Math.random() * Math.PI * 2;
      animal.slitherPhase = Math.random() * Math.PI * 2;
      animal.size = animal.species === 'giraffe' ? (Math.random() * 0.2 + 1.25) : (animal.species === 'snake' ? (Math.random() * 0.2 + 1.1) : (Math.random() * 0.25 + 1.15));
      animal.coatVariant = Math.floor(Math.random() * 3);
    }

    _drawWildlifeAnimal(ctx, x, y, scale, depth, animal, isStopped, speed) {
      ctx.save();
      ctx.translate(x, y);
      if (animal.facing) {
        ctx.scale(animal.facing, 1);
      }
      switch (animal.species) {
        case 'giraffe':
          this._drawGiraffe(ctx, 0, 0, scale, depth, animal, isStopped);
          break;
        case 'snake':
          this._drawSnake(ctx, 0, 0, scale, depth, animal, isStopped);
          break;
        case 'mustang':
          this._drawMustang(ctx, 0, 0, scale, depth, animal, isStopped);
          break;
        case 'pronghorn':
          this._drawPronghorn(ctx, 0, 0, scale, depth, animal, isStopped);
          break;
        case 'elk':
          this._drawElk(ctx, 0, 0, scale, depth, animal, isStopped);
          break;
        case 'ram':
          this._drawBighornRam(ctx, 0, 0, scale, depth, animal, isStopped);
          break;
        case 'bison':
        default:
          this._drawBison(ctx, 0, 0, scale, depth, animal, isStopped, speed);
          break;
      }
      ctx.restore();
    }

    /* 1. AMERICAN BISON (BUFFALO) - Heavy shaggy hump, beard, curved horns, cloven hooves */
    _drawBison(ctx, x, y, scale, depth, b, isStopped, speed) {
      ctx.save();
      if (x || y) ctx.translate(x, y);

      const alpha = Math.min(1.0, 0.42 + depth * 0.58);
      ctx.lineWidth = 1.0 * this.dpr;

      const s = scale * 24; // Enlarged scale
      const legPhase = b.gallopPhase;

      // Leg stride swing physics
      const fLeg1 = Math.sin(legPhase) * 14;
      const fLeg2 = Math.sin(legPhase + Math.PI * 0.85) * 14;
      const bLeg1 = Math.cos(legPhase) * 16;
      const bLeg2 = Math.cos(legPhase + Math.PI * 0.85) * 16;

      // Body & Massive Muscular Hump
      ctx.fillStyle = `rgba(24, 8, 2, ${alpha})`;
      ctx.strokeStyle = `rgba(245, 130, 30, ${0.28 * depth})`;

      ctx.beginPath();
      ctx.moveTo(-s * 0.72, -s * 0.12);
      ctx.quadraticCurveTo(-s * 0.42, -s * 0.92, 0, -s * 0.82); // Massive shoulder hump
      ctx.quadraticCurveTo(s * 0.52, -s * 0.50, s * 0.88, -s * 0.12); // Sloping back to rump
      ctx.lineTo(s * 0.88, s * 0.32); // Rump

      // Back legs with hock angles & hooves
      ctx.lineTo(s * 0.68 + bLeg1 * 0.32, s * 0.92);
      ctx.lineTo(s * 0.46, s * 0.32);
      ctx.lineTo(s * 0.36 + bLeg2 * 0.32, s * 0.92);
      ctx.lineTo(s * 0.16, s * 0.32);

      // Belly
      ctx.lineTo(-s * 0.26, s * 0.38);

      // Front legs & heavy shaggy chest
      ctx.lineTo(-s * 0.46 + fLeg1 * 0.32, s * 0.96);
      ctx.lineTo(-s * 0.58, s * 0.32);
      ctx.lineTo(-s * 0.72 + fLeg2 * 0.32, s * 0.92);

      // Shaggy bearded head
      const headY = s * 0.20;
      const snoutY = -s * 0.12;
      const headTopY = -s * 0.50;

      ctx.lineTo(-s * 0.88, headY);
      ctx.lineTo(-s * 1.08, snoutY); // Muzzle
      ctx.lineTo(-s * 0.98, headTopY); // Forehead
      ctx.closePath();
      ctx.fill();
      if (depth > 0.30) ctx.stroke();

      // Shaggy Wool Beard Tuft
      ctx.beginPath();
      ctx.fillStyle = `rgba(18, 5, 2, ${alpha})`;
      ctx.moveTo(-s * 0.88, headY);
      ctx.lineTo(-s * 1.08, snoutY);
      ctx.lineTo(-s * 1.04, headY + s * 0.22 + Math.sin(legPhase) * s * 0.08); // Swaying beard
      ctx.closePath();
      ctx.fill();

      // Shaggy Front Cape Layer (Two-tone golden russet coat depth)
      if (depth > 0.30) {
        ctx.fillStyle = `rgba(55, 22, 8, ${0.45 * depth})`;
        ctx.beginPath();
        ctx.arc(-s * 0.3, -s * 0.45, s * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }

      // Curved Horns with Ivory Highlight & Dark Tip
      ctx.beginPath();
      ctx.strokeStyle = `rgba(254, 240, 138, ${Math.min(1.0, depth * 1.3)})`;
      ctx.lineWidth = Math.max(1.4 * this.dpr, 2.6 * scale);
      ctx.moveTo(-s * 0.96, headTopY);
      ctx.quadraticCurveTo(-s * 1.20, headTopY - s * 0.32, -s * 0.98, headTopY - s * 0.38);
      ctx.stroke();

      // Swishing Tail with Tuft
      ctx.beginPath();
      ctx.strokeStyle = `rgba(20, 6, 2, ${alpha})`;
      ctx.lineWidth = Math.max(1.2 * this.dpr, 2.2 * scale);
      ctx.moveTo(s * 0.88, -s * 0.08);
      const tailSwing = Math.sin(legPhase) * 6 * scale;
      ctx.quadraticCurveTo(s * 1.10, s * 0.20 + tailSwing, s * 1.04, s * 0.65);
      ctx.stroke();

      // Amber Eye Glint
      if (depth > 0.35) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(-s * 0.98, -s * 0.24, Math.max(1.0 * this.dpr, 1.6 * scale), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    /* 2. WILD MUSTANG (HORSE) - Athletic build, streaming windblown mane & tail, markings */
    _drawMustang(ctx, x, y, scale, depth, h, isStopped) {
      ctx.save();
      if (x || y) ctx.translate(x, y);

      const alpha = Math.min(1.0, 0.42 + depth * 0.58);
      // Coat variants: Deep Bay, Chestnut, or Obsidian Stallion
      const coat = h.coatVariant === 0 ? `rgba(50, 18, 6, ${alpha})` : h.coatVariant === 1 ? `rgba(36, 12, 4, ${alpha})` : `rgba(20, 7, 2, ${alpha})`;
      ctx.fillStyle = coat;
      ctx.strokeStyle = `rgba(245, 150, 40, ${0.25 * depth})`;
      ctx.lineWidth = 1.0 * this.dpr;

      const s = scale * 23; // Enlarged scale
      const legPhase = h.gallopPhase;

      const fLeg1 = Math.sin(legPhase) * 16;
      const fLeg2 = Math.sin(legPhase + Math.PI * 0.85) * 16;
      const bLeg1 = Math.cos(legPhase) * 17;
      const bLeg2 = Math.cos(legPhase + Math.PI * 0.85) * 17;

      ctx.beginPath();
      // Athletic Arched Neck, Back & Powerful Haunches
      ctx.moveTo(-s * 0.52, -s * 0.38);
      ctx.quadraticCurveTo(0, -s * 0.46, s * 0.52, -s * 0.38); // Back
      ctx.quadraticCurveTo(s * 0.84, -s * 0.32, s * 0.98, 0); // Muscular quarters
      ctx.lineTo(s * 0.92, s * 0.26);

      // Back legs (Slender, athletic with defined hock joints)
      ctx.lineTo(s * 0.78 + bLeg1 * 0.32, s * 0.94);
      ctx.lineTo(s * 0.58, s * 0.26);
      ctx.lineTo(s * 0.46 + bLeg2 * 0.32, s * 0.94);
      ctx.lineTo(s * 0.26, s * 0.22);

      // Lean athletic belly
      ctx.lineTo(-s * 0.22, s * 0.22);

      // Front legs
      ctx.lineTo(-s * 0.38 + fLeg1 * 0.32, s * 0.96);
      ctx.lineTo(-s * 0.48, s * 0.22);
      ctx.lineTo(-s * 0.64 + fLeg2 * 0.32, s * 0.96);
      ctx.lineTo(-s * 0.68, s * 0.12);

      // Proud Arched Neck and Aerodynamic Head
      ctx.lineTo(-s * 0.98, -s * 0.65); // Throat
      ctx.lineTo(-s * 1.25, -s * 0.80); // Muzzle
      ctx.lineTo(-s * 1.08, -s * 1.02); // Forehead & ears
      ctx.closePath();
      ctx.fill();
      if (depth > 0.30) ctx.stroke();

      // Flowing Windblown Mane Streaming in the Breeze
      ctx.beginPath();
      ctx.strokeStyle = `rgba(16, 4, 2, ${alpha})`;
      ctx.lineWidth = Math.max(1.6 * this.dpr, 3.0 * scale);
      for (let m = 0; m < 4; m++) {
        const my = -s * 0.45 - m * s * 0.14;
        const mx = -s * 0.65 - m * s * 0.12;
        ctx.moveTo(mx, my);
        ctx.quadraticCurveTo(mx + s * 0.22, my - s * 0.12 + Math.sin(legPhase + m) * 4 * scale, mx + s * 0.35, my + s * 0.05);
      }
      ctx.stroke();

      // Flying Wild Tail Streaming High in the Wind
      ctx.beginPath();
      ctx.strokeStyle = `rgba(18, 4, 2, ${alpha})`;
      ctx.lineWidth = Math.max(1.8 * this.dpr, 3.2 * scale);
      ctx.moveTo(s * 0.98, -s * 0.02);
      const tailFly = Math.sin(legPhase) * 8 * scale;
      ctx.quadraticCurveTo(s * 1.30, s * 0.15 + tailFly, s * 1.25, s * 0.78);
      ctx.stroke();

      // White Star / Blaze Marking on Forehead
      if (depth > 0.30) {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.85 * alpha})`;
        ctx.beginPath();
        ctx.arc(-s * 1.12, -s * 0.88, Math.max(1.2 * this.dpr, 2.0 * scale), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    /* 3. PRONGHORN ANTELOPE - Swift gazelle silhouette, dual white throat bars, hooked black horns */
    _drawPronghorn(ctx, x, y, scale, depth, a, isStopped) {
      ctx.save();
      if (x || y) ctx.translate(x, y);

      const alpha = Math.min(1.0, 0.42 + depth * 0.58);
      ctx.fillStyle = `rgba(56, 22, 8, ${alpha})`;
      ctx.strokeStyle = `rgba(245, 160, 50, ${0.28 * depth})`;
      ctx.lineWidth = 1.0 * this.dpr;

      const s = scale * 20; // Enlarged scale
      const legPhase = a.gallopPhase;

      // Swift, high-bounding leaps
      const fLeg1 = Math.sin(legPhase) * 18;
      const fLeg2 = Math.sin(legPhase + Math.PI * 0.8) * 18;
      const bLeg1 = Math.cos(legPhase) * 18;
      const bLeg2 = Math.cos(legPhase + Math.PI * 0.8) * 18;

      ctx.beginPath();
      // Compact, Slender Aerodynamic Body
      ctx.moveTo(-s * 0.42, -s * 0.32);
      ctx.quadraticCurveTo(0, -s * 0.38, s * 0.52, -s * 0.30);
      ctx.lineTo(s * 0.78, 0);

      // Swift slender gazelle hind legs
      ctx.lineTo(s * 0.64 + bLeg1 * 0.36, s * 0.96);
      ctx.lineTo(s * 0.48, s * 0.22);
      ctx.lineTo(s * 0.38 + bLeg2 * 0.36, s * 0.96);
      ctx.lineTo(s * 0.22, s * 0.16);

      // Belly
      ctx.lineTo(-s * 0.22, s * 0.16);

      // Front legs
      ctx.lineTo(-s * 0.32 + fLeg1 * 0.36, s * 0.96);
      ctx.lineTo(-s * 0.42, s * 0.16);
      ctx.lineTo(-s * 0.58 + fLeg2 * 0.36, s * 0.96);

      // Slender neck and sharp alert head
      ctx.lineTo(-s * 0.84, -s * 0.70);
      ctx.lineTo(-s * 1.10, -s * 0.75); // Snout
      ctx.lineTo(-s * 0.94, -s * 1.02); // Crown
      ctx.closePath();
      ctx.fill();
      if (depth > 0.30) ctx.stroke();

      // Bold White Throat Collar Bars (Iconic Pronghorn Markings)
      ctx.fillStyle = `rgba(254, 243, 199, ${alpha * 0.92})`;
      ctx.beginPath();
      ctx.ellipse(-s * 0.68, -s * 0.35, s * 0.12, s * 0.05, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-s * 0.76, -s * 0.52, s * 0.10, s * 0.04, -0.4, 0, Math.PI * 2);
      ctx.fill();

      // Radiant White Flank Rump Patch
      ctx.beginPath();
      ctx.arc(s * 0.68, -s * 0.04, s * 0.20, 0, Math.PI * 2);
      ctx.fill();

      // Black Hooked Horns with Forward Prongs
      ctx.beginPath();
      ctx.strokeStyle = `rgba(18, 6, 2, ${alpha})`;
      ctx.lineWidth = Math.max(1.4 * this.dpr, 2.2 * scale);
      ctx.moveTo(-s * 0.92, -s * 1.00);
      ctx.lineTo(-s * 0.88, -s * 1.40);
      ctx.lineTo(-s * 1.00, -s * 1.48); // Forward hook
      // Forward prong spur
      ctx.moveTo(-s * 0.90, -s * 1.20);
      ctx.lineTo(-s * 1.02, -s * 1.26);
      ctx.stroke();

      ctx.restore();
    }

    /* 4. MAJESTIC ELK (STAG) - Branching 6-point antler crown, dark shaggy neck ruff, buff rump */
    _drawElk(ctx, x, y, scale, depth, elk, isStopped) {
      ctx.save();
      if (x || y) ctx.translate(x, y);

      const alpha = Math.min(1.0, 0.42 + depth * 0.58);
      ctx.fillStyle = `rgba(42, 16, 5, ${alpha})`;
      ctx.strokeStyle = `rgba(245, 130, 30, ${0.28 * depth})`;
      ctx.lineWidth = 1.0 * this.dpr;

      const s = scale * 24; // Enlarged scale
      const legPhase = elk.gallopPhase;

      const fLeg1 = Math.sin(legPhase) * 15;
      const fLeg2 = Math.sin(legPhase + Math.PI * 0.85) * 15;
      const bLeg1 = Math.cos(legPhase) * 16;
      const bLeg2 = Math.cos(legPhase + Math.PI * 0.85) * 16;

      ctx.beginPath();
      // Proud Tall Cervid Body
      ctx.moveTo(-s * 0.52, -s * 0.42);
      ctx.quadraticCurveTo(0, -s * 0.50, s * 0.58, -s * 0.40);
      ctx.lineTo(s * 0.88, -s * 0.05);

      // Back legs
      ctx.lineTo(s * 0.74 + bLeg1 * 0.32, s * 0.95);
      ctx.lineTo(s * 0.52, s * 0.28);
      ctx.lineTo(s * 0.42 + bLeg2 * 0.32, s * 0.95);
      ctx.lineTo(s * 0.22, s * 0.22);

      // Belly
      ctx.lineTo(-s * 0.26, s * 0.28);

      // Front legs
      ctx.lineTo(-s * 0.42 + fLeg1 * 0.32, s * 0.96);
      ctx.lineTo(-s * 0.52, s * 0.22);
      ctx.lineTo(-s * 0.68 + fLeg2 * 0.32, s * 0.96);

      // Deep Shaggy Maned Chest and Arched Neck
      ctx.lineTo(-s * 0.80, -s * 0.42);
      ctx.lineTo(-s * 1.15, -s * 0.80); // Muzzle
      ctx.lineTo(-s * 0.98, -s * 1.02); // Crown
      ctx.closePath();
      ctx.fill();
      if (depth > 0.30) ctx.stroke();

      // Shaggy Dark Neck Ruff (Contrasting cape)
      ctx.fillStyle = `rgba(20, 7, 2, ${alpha * 0.95})`;
      ctx.beginPath();
      ctx.moveTo(-s * 0.62, -s * 0.35);
      ctx.lineTo(-s * 0.80, -s * 0.42);
      ctx.lineTo(-s * 0.98, -s * 0.82);
      ctx.lineTo(-s * 0.74, -s * 0.65);
      ctx.closePath();
      ctx.fill();

      // Pale Golden-Buff Rump Patch
      ctx.fillStyle = `rgba(253, 230, 138, ${alpha * 0.88})`;
      ctx.beginPath();
      ctx.arc(s * 0.74, -s * 0.12, s * 0.18, 0, Math.PI * 2);
      ctx.fill();

      // Grand Multi-Tine Branching Antler Rack
      ctx.beginPath();
      ctx.strokeStyle = `rgba(254, 240, 138, ${Math.min(1.0, depth * 1.35)})`;
      ctx.lineWidth = Math.max(1.4 * this.dpr, 2.4 * scale);
      // Main sweeping beam
      ctx.moveTo(-s * 0.98, -s * 1.02);
      ctx.quadraticCurveTo(-s * 0.72, -s * 1.70, -s * 0.38, -s * 1.95);
      // Brow tine
      ctx.moveTo(-s * 0.92, -s * 1.18);
      ctx.lineTo(-s * 1.18, -s * 1.40);
      // Bez tine
      ctx.moveTo(-s * 0.80, -s * 1.42);
      ctx.lineTo(-s * 0.95, -s * 1.72);
      // Royal tine
      ctx.moveTo(-s * 0.58, -s * 1.70);
      ctx.lineTo(-s * 0.65, -s * 2.05);
      ctx.stroke();

      ctx.restore();
    }

    /* 5. DESERT BIGHORN RAM - Massive ridged curled spiral horns, stocky muscular mountain build */
    _drawBighornRam(ctx, x, y, scale, depth, ram, isStopped) {
      ctx.save();
      if (x || y) ctx.translate(x, y);

      const alpha = Math.min(1.0, 0.42 + depth * 0.58);
      ctx.fillStyle = `rgba(36, 14, 4, ${alpha})`;
      ctx.strokeStyle = `rgba(245, 140, 40, ${0.28 * depth})`;
      ctx.lineWidth = 1.0 * this.dpr;

      const s = scale * 20; // Enlarged scale
      const legPhase = ram.gallopPhase;

      const fLeg1 = Math.sin(legPhase) * 13;
      const fLeg2 = Math.sin(legPhase + Math.PI * 0.85) * 13;
      const bLeg1 = Math.cos(legPhase) * 14;
      const bLeg2 = Math.cos(legPhase + Math.PI * 0.85) * 14;

      ctx.beginPath();
      // Stocky, Powerful Mountain Body
      ctx.moveTo(-s * 0.52, -s * 0.38);
      ctx.quadraticCurveTo(0, -s * 0.44, s * 0.52, -s * 0.34);
      ctx.lineTo(s * 0.78, 0);

      // Back legs
      ctx.lineTo(s * 0.64 + bLeg1 * 0.32, s * 0.88);
      ctx.lineTo(s * 0.48, s * 0.28);
      ctx.lineTo(s * 0.38 + bLeg2 * 0.32, s * 0.88);
      ctx.lineTo(s * 0.18, s * 0.22);

      // Belly
      ctx.lineTo(-s * 0.22, s * 0.28);

      // Front legs
      ctx.lineTo(-s * 0.38 + fLeg1 * 0.32, s * 0.88);
      ctx.lineTo(-s * 0.48, s * 0.22);
      ctx.lineTo(-s * 0.64 + fLeg2 * 0.32, s * 0.88);

      // Muscular Neck & Head
      const headY = -s * 0.48;
      const snoutY = -s * 0.38;
      ctx.lineTo(-s * 0.78, headY);
      ctx.lineTo(-s * 1.02, snoutY);
      ctx.lineTo(-s * 0.90, headY - s * 0.38);
      ctx.closePath();
      ctx.fill();
      if (depth > 0.30) ctx.stroke();

      // Massive Heavy Spiral Curled Horns (Sweeping backward and down around ears)
      const hornY = headY - s * 0.38;
      ctx.beginPath();
      ctx.strokeStyle = `rgba(253, 224, 71, ${Math.min(1.0, depth * 1.35)})`;
      ctx.lineWidth = Math.max(2.0 * this.dpr, 3.4 * scale);
      ctx.arc(-s * 0.74, hornY + s * 0.16, s * 0.40, Math.PI * 1.05, Math.PI * 2.85);
      ctx.stroke();

      // Horn Ridge Segment Textures
      if (depth > 0.35) {
        ctx.strokeStyle = `rgba(120, 53, 15, ${0.5 * depth})`;
        ctx.lineWidth = 1.0 * this.dpr;
        for (let r = 0; r < 5; r++) {
          const rAng = Math.PI * 1.2 + r * 0.3;
          const rx = -s * 0.74 + Math.cos(rAng) * s * 0.40;
          const ry = hornY + s * 0.16 + Math.sin(rAng) * s * 0.40;
          ctx.beginPath();
          ctx.moveTo(rx - 2 * scale, ry - 2 * scale);
          ctx.lineTo(rx + 2 * scale, ry + 2 * scale);
          ctx.stroke();
        }
      }

      ctx.restore();
    }

    /* 6. TOWERING GIRAFFE - Long stilted legs, skyward neck, polygonal coat spots, ossicones */
    _drawGiraffe(ctx, x, y, scale, depth, g, isStopped) {
      ctx.save();
      if (x || y) ctx.translate(x, y);

      const alpha = Math.min(1.0, 0.44 + depth * 0.56);
      ctx.fillStyle = `rgba(42, 18, 5, ${alpha})`;
      ctx.strokeStyle = `rgba(255, 180, 70, ${0.30 * depth})`;
      ctx.lineWidth = 1.0 * this.dpr;

      const s = scale * 26; // Enlarged scale
      const legPhase = g.gallopPhase;

      // Stately, rhythmic long-legged gallop
      const fLeg1 = Math.sin(legPhase) * 18;
      const fLeg2 = Math.sin(legPhase + Math.PI * 0.85) * 18;
      const bLeg1 = Math.cos(legPhase) * 18;
      const bLeg2 = Math.cos(legPhase + Math.PI * 0.85) * 18;

      ctx.beginPath();
      // Sloping Spine & Tall Shoulders
      ctx.moveTo(-s * 0.38, -s * 0.75); // High shoulders
      ctx.quadraticCurveTo(0, -s * 0.60, s * 0.54, -s * 0.38); // Steeply sloping spine
      ctx.lineTo(s * 0.70, -s * 0.06); // Rump

      // Long Stilted Back Legs
      ctx.lineTo(s * 0.60 + bLeg1 * 0.34, s * 1.22);
      ctx.lineTo(s * 0.44, 0);
      ctx.lineTo(s * 0.34 + bLeg2 * 0.34, s * 1.22);
      ctx.lineTo(s * 0.16, -s * 0.06);

      // Belly
      ctx.lineTo(-s * 0.16, -s * 0.06);

      // Long Stilted Front Legs
      ctx.lineTo(-s * 0.28 + fLeg1 * 0.34, s * 1.32);
      ctx.lineTo(-s * 0.38, -s * 0.12);
      ctx.lineTo(-s * 0.52 + fLeg2 * 0.34, s * 1.32);

      // Towering Long Graceful Neck Reaching Skyward
      const headX = -s * 0.85;
      const headY = -s * 2.35;

      ctx.lineTo(-s * 0.56, -s * 0.85);
      ctx.lineTo(headX, headY);
      ctx.lineTo(headX - s * 0.30, headY + s * 0.16); // Muzzle
      ctx.lineTo(headX - s * 0.16, headY - s * 0.16); // Crown
      ctx.closePath();
      ctx.fill();
      if (depth > 0.30) ctx.stroke();

      // Giraffe Crown Ossicones (Rounded Knobby Horns)
      ctx.beginPath();
      ctx.strokeStyle = `rgba(254, 240, 138, ${Math.min(1.0, depth * 1.4)})`;
      ctx.lineWidth = Math.max(1.4 * this.dpr, 2.2 * scale);
      ctx.moveTo(headX - s * 0.08, headY - s * 0.12);
      ctx.lineTo(headX - s * 0.08, headY - s * 0.36);
      ctx.moveTo(headX - s * 0.18, headY - s * 0.10);
      ctx.lineTo(headX - s * 0.18, headY - s * 0.34);
      ctx.stroke();

      // Tufted Knobs
      ctx.fillStyle = `rgba(20, 6, 2, ${alpha})`;
      ctx.beginPath();
      ctx.arc(headX - s * 0.08, headY - s * 0.36, 1.8 * scale, 0, Math.PI * 2);
      ctx.arc(headX - s * 0.18, headY - s * 0.34, 1.8 * scale, 0, Math.PI * 2);
      ctx.fill();

      // Rich Geometric Polygon Coat Spots Along Neck & Flanks
      if (depth > 0.30) {
        ctx.fillStyle = `rgba(245, 158, 11, ${0.45 * depth})`;
        // Neck patches
        for (let p = 0; p < 5; p++) {
          const py = -s * 0.70 - p * s * 0.32;
          const px = -s * 0.42 + (headX + s * 0.42) * (p / 5);
          ctx.beginPath();
          ctx.arc(px, py, 2.8 * scale, 0, Math.PI * 2);
          ctx.fill();
        }
        // Body flank patches
        ctx.beginPath();
        ctx.arc(s * 0.15, -s * 0.40, 3.2 * scale, 0, Math.PI * 2);
        ctx.arc(s * 0.35, -s * 0.28, 3.0 * scale, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    /* 7. SLITHERING DESERT SNAKE - Diamondback dorsal pattern, triangular viper head, forked tongue */
    _drawSnake(ctx, x, y, scale, depth, sn, isStopped) {
      ctx.save();
      if (x || y) ctx.translate(x, y);

      const alpha = Math.min(1.0, 0.45 + depth * 0.55);
      ctx.strokeStyle = `rgba(32, 14, 4, ${alpha})`;
      ctx.lineWidth = Math.max(3.2 * this.dpr, 6.2 * scale); // Enlarged body thickness
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const length = 56 * scale; // Enlarged snake length
      const wavePhase = sn.slitherPhase || 0;
      const numSegments = 20;

      ctx.beginPath();
      for (let i = 0; i < numSegments; i++) {
        const u = i / (numSegments - 1);
        const segX = (u - 0.5) * length;
        const segY = Math.sin(wavePhase + u * Math.PI * 3.8) * (5.5 * scale * (1 - u * 0.3));
        if (i === 0) {
          ctx.moveTo(segX, segY);
        } else {
          ctx.lineTo(segX, segY);
        }
      }
      ctx.stroke();

      // Diamondback Dorsal Geometric Pattern Along Spine
      if (depth > 0.30) {
        ctx.fillStyle = `rgba(217, 119, 6, ${0.75 * alpha})`;
        for (let d = 2; d < numSegments - 2; d += 2) {
          const du = d / (numSegments - 1);
          const dx = (du - 0.5) * length;
          const dy = Math.sin(wavePhase + du * Math.PI * 3.8) * (5.5 * scale * (1 - du * 0.3));
          ctx.beginPath();
          ctx.moveTo(dx, dy - 2.5 * scale);
          ctx.lineTo(dx + 2.5 * scale, dy);
          ctx.lineTo(dx, dy + 2.5 * scale);
          ctx.lineTo(dx - 2.5 * scale, dy);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Broad Triangular Viper Head
      const headX = -length * 0.5;
      const headY = Math.sin(wavePhase) * (5.5 * scale);
      ctx.fillStyle = `rgba(36, 16, 4, ${alpha})`;
      ctx.beginPath();
      ctx.arc(headX, headY, 3.6 * scale, 0, Math.PI * 2);
      ctx.fill();

      // Predatory Golden Eyes
      if (depth > 0.30) {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(headX - 1.2 * scale, headY - 1.8 * scale, 1.2 * scale, 0, Math.PI * 2);
        ctx.fill();
      }

      // Flickering Forked Red Tongue
      if (Math.sin(wavePhase * 2.5) > 0.2) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.92)';
        ctx.lineWidth = Math.max(1.0 * this.dpr, 1.6 * scale);
        ctx.beginPath();
        ctx.moveTo(headX, headY);
        ctx.lineTo(headX - 8 * scale, headY);
        // Fork tips
        ctx.lineTo(headX - 11 * scale, headY - 2.5 * scale);
        ctx.moveTo(headX - 8 * scale, headY);
        ctx.lineTo(headX - 11 * scale, headY + 2.5 * scale);
        ctx.stroke();
      }

      ctx.restore();
    }

    /* 8. GIANT SAGUARO CACTUS */
    _drawSaguaroCactus(ctx, x, y, scale, cactus, swayAngle) {
      ctx.save();
      ctx.translate(x, y);

      const flexSway = swayAngle * cactus.flexibility;
      const ch = cactus.height * scale;
      const cw = Math.max(4.5 * this.dpr, 7.5 * scale);

      const alpha = Math.min(1.0, 0.46 + cactus.z * 0.54);
      ctx.fillStyle = `rgba(16, 28, 14, ${alpha})`;
      ctx.strokeStyle = `rgba(186, 230, 253, ${0.18 * cactus.z})`;
      ctx.lineWidth = 0.9 * this.dpr;

      // 1. Central Saguaro Column (Rounded vertical trunk)
      const topSway = flexSway * 18 * scale;
      ctx.beginPath();
      ctx.moveTo(-cw * 0.5, 0);
      ctx.lineTo(-cw * 0.5 + topSway, -ch);
      ctx.arc(topSway, -ch, cw * 0.5, Math.PI, 0);
      ctx.lineTo(cw * 0.5, 0);
      ctx.closePath();
      ctx.fill();
      if (cactus.z > 0.35) ctx.stroke();

      // 2. Iconic Raised Saguaro Arms
      const armCount = cactus.arms || 2;
      for (let a = 0; a < armCount; a++) {
        const armSide = (a % 2 === 0) ? -1 : 1;
        const armY = -ch * (0.38 + a * 0.22);
        const armLength = 12 * scale;
        const armHeight = 14 * scale;
        const armSway = flexSway * (12 + a * 5) * scale;

        ctx.beginPath();
        ctx.moveTo(armSway, armY);
        ctx.lineTo(armSway + armSide * armLength, armY);
        ctx.lineTo(armSway + armSide * armLength, armY - armHeight);
        ctx.arc(armSway + armSide * armLength, armY - armHeight, cw * 0.35, 0, Math.PI, true);
        ctx.lineTo(armSway + armSide * (armLength - cw * 0.6), armY + cw * 0.6);
        ctx.lineTo(armSway, armY + cw * 0.6);
        ctx.closePath();
        ctx.fill();
        if (cactus.z > 0.35) ctx.stroke();
      }

      ctx.restore();
    }

    /* 9. DISTANT ARK VESSEL HORIZON BEACON */
    _drawArkVessel(ctx, cx, horizonY) {
      ctx.save();
      const arkW = 44 * this.dpr;
      const arkH = 14 * this.dpr;
      const arkX = cx;
      const arkY = horizonY - 2 * this.dpr;

      // Warm Golden Horizon Beacon Glow
      const beaconGrad = ctx.createRadialGradient(arkX, arkY - 4 * this.dpr, 2 * this.dpr, arkX, arkY - 4 * this.dpr, 36 * this.dpr);
      beaconGrad.addColorStop(0, 'rgba(255, 235, 160, 0.7)');
      beaconGrad.addColorStop(0.35, 'rgba(245, 150, 40, 0.3)');
      beaconGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = beaconGrad;
      ctx.beginPath();
      ctx.arc(arkX, arkY - 4 * this.dpr, 36 * this.dpr, 0, Math.PI * 2);
      ctx.fill();

      // Distant Ark Hull Silhouette
      ctx.fillStyle = '#1e0c06';
      ctx.beginPath();
      ctx.moveTo(arkX - arkW * 0.5, arkY);
      ctx.lineTo(arkX - arkW * 0.4, arkY - arkH * 0.6);
      ctx.lineTo(arkX + arkW * 0.4, arkY - arkH * 0.6);
      ctx.lineTo(arkX + arkW * 0.5, arkY);
      ctx.closePath();
      ctx.fill();

      // Upper Cabin / Deck House
      ctx.fillStyle = '#140603';
      ctx.beginPath();
      ctx.rect(arkX - arkW * 0.28, arkY - arkH * 1.15, arkW * 0.56, arkH * 0.58);
      ctx.fill();

      // Pitched Roof
      ctx.beginPath();
      ctx.moveTo(arkX - arkW * 0.32, arkY - arkH * 1.15);
      ctx.lineTo(arkX, arkY - arkH * 1.55);
      ctx.lineTo(arkX + arkW * 0.32, arkY - arkH * 1.15);
      ctx.closePath();
      ctx.fill();

      // Luminous Lantern on the Ark Mast
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(arkX, arkY - arkH * 1.6, 2.2 * this.dpr, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    _getRoundedRectPt(t, x, y, w, h, r) {
      t = ((t % 1) + 1) % 1;
      const straightW = w - 2 * r;
      const straightH = h - 2 * r;
      const cornerArc = 0.5 * Math.PI * r;
      const totalPerimeter = 2 * straightW + 2 * straightH + 4 * cornerArc;

      const topSeg = straightW / totalPerimeter;
      const trCornerSeg = cornerArc / totalPerimeter;
      const rightSeg = straightH / totalPerimeter;
      const brCornerSeg = cornerArc / totalPerimeter;
      const botSeg = straightW / totalPerimeter;
      const blCornerSeg = cornerArc / totalPerimeter;
      const leftSeg = straightH / totalPerimeter;
      const tlCornerSeg = cornerArc / totalPerimeter;

      let cur = 0;

      if (t < cur + topSeg) {
        const u = (t - cur) / topSeg;
        return { x: x + r + u * straightW, y: y };
      }
      cur += topSeg;

      if (t < cur + trCornerSeg) {
        const u = (t - cur) / trCornerSeg;
        const theta = -Math.PI / 2 + u * (Math.PI / 2);
        return { x: x + w - r + Math.cos(theta) * r, y: y + r + Math.sin(theta) * r };
      }
      cur += trCornerSeg;

      if (t < cur + rightSeg) {
        const u = (t - cur) / rightSeg;
        return { x: x + w, y: y + r + u * straightH };
      }
      cur += rightSeg;

      if (t < cur + brCornerSeg) {
        const u = (t - cur) / brCornerSeg;
        const theta = 0 + u * (Math.PI / 2);
        return { x: x + w - r + Math.cos(theta) * r, y: y + h - r + Math.sin(theta) * r };
      }
      cur += brCornerSeg;

      if (t < cur + botSeg) {
        const u = (t - cur) / botSeg;
        return { x: x + w - r - u * straightW, y: y + h };
      }
      cur += botSeg;

      if (t < cur + blCornerSeg) {
        const u = (t - cur) / blCornerSeg;
        const theta = Math.PI / 2 + u * (Math.PI / 2);
        return { x: x + r + Math.cos(theta) * r, y: y + h - r + Math.sin(theta) * r };
      }
      cur += blCornerSeg;

      if (t < cur + leftSeg) {
        const u = (t - cur) / leftSeg;
        return { x: x, y: y + h - r - u * straightH };
      }
      cur += leftSeg;

      const u = (t - cur) / tlCornerSeg;
      const theta = Math.PI + u * (Math.PI / 2);
      return { x: x + r + Math.cos(theta) * r, y: y + r + Math.sin(theta) * r };
    }
  }

  const instance = new KineticEngine();
  return instance;
});
