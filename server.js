/**
 * ====================================================================
 * NOMAD HUD & Telemetry Navigation System
 * 
 * Proprietary & Created by BostonyFX
 * All rights reserved.
 * ====================================================================
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// API health endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'NOMAD: Hyperspace' });
});

// Central Version Endpoint for PWA cache update checks
app.get(['/version.json', '/public/version.json', '/api/version'], (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  try {
    const versionPath = path.join(__dirname, 'version.json');
    if (fs.existsSync(versionPath)) {
      const data = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
      res.json(data);
      return;
    }
  } catch (err) {
    console.error('Error reading version.json:', err);
  }
  res.json({
    version: 'v4.10102026.0914',
    timestamp: Date.now()
  });
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

// Reverse Geocoding Proxy Endpoint
// Proxies Nominatim & OpenStreetMap requests with valid server User-Agent, bypassing browser CORS & ad-blockers
app.get('/api/geocode', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }
    const targetZoom = req.query.zoom || 18;
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=${targetZoom}&addressdetails=1&extratags=1&namedetails=1`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(url, {
      headers: { 'User-Agent': 'NomadAvionicsSuite/4.0 (contact: support@nomadsuite.app)' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`Nominatim returned status ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    try {
      const lat = parseFloat(req.query.lat);
      const lon = parseFloat(req.query.lon);
      const photonUrl = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lon}`;
      const pRes = await fetch(photonUrl);
      if (pRes.ok) {
        const pData = await pRes.json();
        return res.json(pData);
      }
    } catch (_) {}
    res.status(502).json({ error: 'Failed to reverse geocode', message: err.message });
  }
});

// Dynamic Project Backup Endpoint: Generates and serves a clean .ZIP archive of the entire project
app.get(['/api/download-zip', '/download-zip', '/download'], (req, res) => {
  try {
    const zipPythonCmd = `
import os, zipfile
exclude_dirs = {'.git', 'node_modules', '.cache', '.npm'}
exclude_files = {'nomad_suite.zip', 'nomad-roadtrip.zip'}
with zipfile.ZipFile('nomad_suite.zip', 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('nomad_suite'):
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for file in files:
            if file in exclude_files:
                continue
            path = os.path.join(root, file)
            arcname = os.path.relpath(path, 'nomad_suite')
            zipf.write(path, arcname)
`;
    execSync(`python3 -c "${zipPythonCmd.replace(/"/g, '\\"')}"`, { cwd: __dirname });
    const zipPath = path.join(__dirname, 'nomad_suite.zip');
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="nomad_suite.zip"');
    res.download(zipPath, 'nomad_suite.zip');
  } catch (err) {
    console.error('Failed to create zip:', err);
    res.status(500).send('Error creating zip archive');
  }
});

// Canonical redirect for legacy nomad_digit path
app.get(['/nomad_digit', '/nomad_digit.html'], (req, res) => {
  res.redirect(301, '/digit.html');
});

// Dedicated routes for DIGIT with aggressive cache busting
app.get(['/digit', '/digit.html'], (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'digit.html'));
});

// Dedicated routes for Service Worker (Never cache sw.js, allow immediate update checks)
app.get(['/sw.js', '/nomad_suite/sw.js'], (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Service-Worker-Allowed', '/');
  res.sendFile(path.join(__dirname, req.path));
});

// Dedicated routes for Launch Control
app.get(['/launch', '/launch.html', '/launcher', '/nomad_launch'], (req, res) => {
  res.sendFile(path.join(__dirname, 'launch.html'));
});

// Serve static assets with html extension support and cache control for rapid updates
app.use(express.static(__dirname, {
  extensions: ['html'],
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html') || filePath.endsWith('.js') || filePath.endsWith('.json')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// Root fallback to index.html
app.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Fallback for HTML navigation requests
app.use((req, res) => {
  if (req.accepts('html')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(__dirname, 'index.html'));
    return;
  }
  res.status(404).send('Not found');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`NOMAD: Hyperspace server running on http://0.0.0.0:${PORT}`);
});
