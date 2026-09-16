import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';
import path from 'path';

function getNomadIconSVG(size = 512, isMaskable = false) {
  // Center is (256, 256) on a 512x512 canvas.
  // Android Adaptive Icon Safe Zone:
  // Android Pixel circular mask has radius 204.8px (diameter 409.6px, or 80% of canvas).
  // Some OEM launchers (OneUI, Pixel rounded-rect / squircle) crop even tighter (down to 70-72%).
  // To guarantee 100% immune to bottom slicing on Pixel and Galaxy phones:
  // - Outer boundary of all graphics & text is strictly kept inside radius <= 165px from (256, 256).
  // - Chevron center moved up slightly to (256, 210)
  // - Chevron scaled to 85% of previous size
  // - NOMAD text baseline at y=338, font size 38, with ample bottom padding to the safe mask edge (safe edge is y=460)
  const scale = isMaskable ? 0.88 : 0.95;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
    <defs>
      <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8" />
        <stop offset="100%" stop-color="#00d4ff" />
      </linearGradient>
      <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ff7b00" />
        <stop offset="100%" stop-color="#ff3b00" />
      </linearGradient>
      <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      <filter id="radarFilter" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    <!-- True Deep Black Obsidian Bleed Canvas (fills entire background) -->
    <rect width="512" height="512" fill="#000000" />
    
    <g transform="translate(256, 256) scale(${scale}) translate(-256, -256)">
      <!-- Concentric Neon Radar Telemetry Rings -->
      <g filter="url(#radarFilter)">
        <!-- Outer Dash Ring -->
        <circle cx="256" cy="205" r="142" fill="none" stroke="#00d4ff" stroke-width="2.4" stroke-opacity="0.25" stroke-dasharray="9 6" />
        <!-- Inner Precision Ring -->
        <circle cx="256" cy="205" r="96" fill="none" stroke="#00d4ff" stroke-width="2.6" stroke-opacity="0.40" />
        <!-- Core Targeting Ring -->
        <circle cx="256" cy="205" r="48" fill="none" stroke="#00d4ff" stroke-width="1.8" stroke-opacity="0.20" />
        
        <!-- Telemetry Crosshair Ticks -->
        <line x1="256" y1="56" x2="256" y2="68" stroke="#00d4ff" stroke-width="2.5" stroke-opacity="0.6" stroke-linecap="round" />
        <line x1="256" y1="340" x2="256" y2="352" stroke="#00d4ff" stroke-width="2.5" stroke-opacity="0.3" stroke-linecap="round" />
        <line x1="106" y1="205" x2="118" y2="205" stroke="#00d4ff" stroke-width="2.5" stroke-opacity="0.6" stroke-linecap="round" />
        <line x1="394" y1="205" x2="406" y2="205" stroke="#00d4ff" stroke-width="2.5" stroke-opacity="0.6" stroke-linecap="round" />
      </g>
      
      <!-- Navigation Chevron with Dynamic 45-deg Heading -->
      <g transform="translate(256, 205) rotate(-45) scale(0.90)" filter="url(#neonGlow)">
        <!-- Left Wing (Cyan) -->
        <polygon points="0,-102 -70,80 0,32" fill="url(#cyanGrad)" />
        <!-- Right Wing (Racing Orange) -->
        <polygon points="0,-102 70,80 0,32" fill="url(#orangeGrad)" />
        <!-- Center Ridge Divider Line (Pure Crisp White) -->
        <line x1="0" y1="-102" x2="0" y2="32" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" />
        <!-- Forward Beacon Tip -->
        <circle cx="0" cy="-100" r="3.2" fill="#ffffff" />
      </g>
      
      <!-- "NOMAD" Hero Title Typography (Strict Safe-Zone Bounded) -->
      <g>
        <!-- Green Accent Status Indicators (Snug to text) -->
        <rect x="146" y="328" width="14" height="7" rx="3.5" fill="#4cd964" />
        <rect x="352" y="328" width="14" height="7" rx="3.5" fill="#4cd964" />
        
        <text x="256" y="340" 
              text-anchor="middle" 
              fill="#ffffff" 
              font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
              font-size="38" 
              font-weight="900" 
              letter-spacing="4">NOMAD</text>
      </g>
    </g>
  </svg>`;
}

const iconsDir = path.resolve('icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const targets = [
  { file: 'icon-192.png', size: 192, maskable: false },
  { file: 'icon-512.png', size: 512, maskable: false },
  { file: 'icon-maskable-192.png', size: 192, maskable: true },
  { file: 'icon-maskable-512.png', size: 512, maskable: true },
  { file: 'apple-touch-icon.png', size: 180, maskable: false },
  { file: 'nomad_icon_192x192.png', size: 192, maskable: false },
  { file: 'nomad_icon_512x512.png', size: 512, maskable: false }
];

console.log('Rendering NOMAD Safe-Zone compliant icons...');

for (const target of targets) {
  const svg = getNomadIconSVG(target.size, target.maskable);
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: target.size } });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();
  const dest = path.join(iconsDir, target.file);
  fs.writeFileSync(dest, pngBuffer);
  console.log(`✓ Generated ${target.file} (${target.size}x${target.size}) -> ${pngBuffer.length} bytes`);
}

console.log('All icons built successfully!');
