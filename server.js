/**
 * ====================================================================
 * NOMAD HUD & Telemetry Navigation System
 * 
 * Proprietary & Created by BostonyFX
 * Instagram: https://instagram.com/neurocosm
 * All rights reserved.
 * ====================================================================
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// API health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'NOMAD: RoadTrip' });
});

// Atmospheric & Weather Telemetry Proxy Endpoint
// Proxies Open-Meteo requests to bypass client ad-blockers, tracking prevention, and iframe restrictions
app.get('/api/weather', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat) || 42.3765;
    const lon = parseFloat(req.query.lon) || -71.2356;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,uv_index,surface_pressure,pressure_msl&temperature_unit=fahrenheit&timezone=auto`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`Open-Meteo returned status ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.warn('Server weather proxy warning:', err.message);
    res.status(502).json({ error: 'Failed to fetch atmospheric telemetry', message: err.message });
  }
});

// Dynamic Project Backup Endpoint: Generates and serves a clean .ZIP archive of the entire project
app.get(['/api/download-zip', '/download-zip', '/download'], (req, res) => {
  try {
    const zipPythonCmd = `
import os, zipfile
exclude_dirs = {'.git', 'node_modules', '.cache', '.npm'}
exclude_files = {'nomad-roadtrip.zip'}
with zipfile.ZipFile('nomad-roadtrip.zip', 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for file in files:
            if file in exclude_files:
                continue
            path = os.path.join(root, file)
            arcname = os.path.relpath(path, '.')
            zipf.write(path, arcname)
`;
    execSync(`python3 -c "${zipPythonCmd.replace(/"/g, '\\"')}"`, { cwd: __dirname });
    const zipPath = path.join(__dirname, 'nomad-roadtrip.zip');
    res.download(zipPath, 'nomad-roadtrip.zip');
  } catch (err) {
    console.error('Failed to create zip:', err);
    res.status(500).send('Error creating zip archive');
  }
});

// Serve static assets with html extension support
app.use(express.static(__dirname, {
  extensions: ['html']
}));

// Root fallback to index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Fallback for HTML navigation requests
app.use((req, res) => {
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, 'index.html'));
    return;
  }
  res.status(404).send('Not found');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`NOMAD: RoadTrip server running on http://0.0.0.0:${PORT}`);
});
