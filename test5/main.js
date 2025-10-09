import 'ol/ol.css';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import GeoTIFF from 'ol/source/GeoTIFF.js';
import TileLayer from 'ol/layer/WebGLTile.js';
import OSM from 'ol/source/OSM.js';
import proj4 from 'proj4';
import { register } from 'ol/proj/proj4.js';
import { get as getProjection, transformExtent } from 'ol/proj.js';

// ======== 1. Register custom WKT CRS ========
const myWKT = `
PROJCS["My Local Projection",
    GEOGCS["GCS_WGS_1984",
        DATUM["D_WGS_1984",
            SPHEROID["WGS_1984",6378137,298.257223563]],
        PRIMEM["Greenwich",0],
        UNIT["Degree",0.0174532925199433]],
    PROJECTION["Transverse_Mercator"],
    PARAMETER["False_Easting",500000],
    PARAMETER["False_Northing",0],
    PARAMETER["Central_Meridian",9],
    PARAMETER["Scale_Factor",0.9996],
    PARAMETER["Latitude_Of_Origin",0],
    UNIT["Meter",1]]
`;
proj4.defs('MY:LOCAL', myWKT);
register(proj4);
const localProjection = getProjection('MY:LOCAL');

// ======== 2. Define color ramp presets ========
// Each ramp maps t=[0,1] to RGB
const colorRamps = {
  Viridis: t => viridis(t),
  Magma: t => magma(t),
  Coolwarm: t => coolwarm(t),
  Terrain: t => terrain(t),
};

// Example ramp functions (simple approximations)
function viridis(t) {
  const r = Math.round(68 + t * (253 - 68));
  const g = Math.round(1 + t * (231 - 1));
  const b = Math.round(84 + t * (37 - 84));
  return [r, g, b, 255];
}
function magma(t) {
  const r = Math.round(0 + t * 255);
  const g = Math.round(0 + t * 80);
  const b = Math.round(3 + t * 150);
  return [r, g, b, 255];
}
function coolwarm(t) {
  const r = Math.round(59 + 196 * t);
  const g = Math.round(76 + 96 * t);
  const b = Math.round(192 - 152 * t);
  return [r, g, b, 255];
}
function terrain(t) {
  if (t < 0.25) return [0, Math.round(128 + 127 * t / 0.25), 0, 255];
  if (t < 0.5) return [Math.round(255 * (t - 0.25) / 0.25), 255, 0, 255];
  if (t < 0.75) return [255, Math.round(255 * (0.75 - t) / 0.25), 0, 255];
  return [255, 255, Math.round(255 * (t - 0.75) / 0.25), 255];
}

// ======== 3. Default ramp ========
let currentRampName = 'Viridis';
let currentRamp = colorRamps[currentRampName];

// ======== 4. Shared helper to build OpenLayers color expression ========
function makeColorExpression(min, max) {
  return [
    'interpolate',
    ['linear'],
    ['band', 1],
    min, [0, 0, 255],
    (min + max) / 2, [0, 255, 0],
    max, [255, 0, 0],
  ];
}

// ======== 5. Create the GeoTIFF source ========
const geoTiffSource = new GeoTIFF({
  sources: [{ url: 'https://example.com/my_custom_wkt_geotiff.tif' }],
  normalize: false,
  convertToRGB: false,
  style: { color: makeColorExpression(0, 255) },
});

// ======== 6. Layers ========
const geoTiffLayer = new TileLayer({ source: geoTiffSource });
const osmLayer = new TileLayer({ source: new OSM() });

// ======== 7. Map setup ========
const map = new Map({
  target: 'map',
  layers: [osmLayer, geoTiffLayer],
  view: new View({ projection: 'EPSG:3857', center: [0, 0], zoom: 2 }),
});

// ======== 8. Progress bar ========
const progressBar = document.getElementById('progress');
const progressText = document.getElementById('progress-text');
let tilesLoaded = 0, tilesTotal = 0;

geoTiffSource.on('tileloadstart', () => { tilesTotal++; updateProgress(); });
geoTiffSource.on('tileloadend', () => { tilesLoaded++; updateProgress(); });
geoTiffSource.on('tileloaderror', () => { tilesLoaded++; updateProgress(); });

function updateProgress() {
  if (tilesTotal === 0) return;
  const percent = Math.min(100, Math.round((tilesLoaded / tilesTotal) * 100));
  progressBar.style.width = `${percent}%`;
  progressText.innerText = `Loading GeoTIFF: ${percent}%`;
  if (percent === 100) setTimeout(() => document.getElementById('progress-container').style.display = 'none', 600);
}

// ======== 9. Fit view + build legend ========
geoTiffSource.on('change', async () => {
  if (geoTiffSource.getState() === 'ready') {
    const extent = geoTiffSource.getExtent();
    if (extent) {
      const reprojectedExtent = transformExtent(extent, localProjection, 'EPSG:3857');
      map.getView().fit(reprojectedExtent, { size: map.getSize(), padding: [20, 20, 20, 20] });
    }
    await updateLegend();
  }
});

// ======== 10. Generate legend dynamically ========
async function updateLegend() {
  const image = await geoTiffSource.getImage();
  const stats = image.sampleStatistics?.[0] ?? {};
  const min = stats.min ?? 0;
  const max = stats.max ?? 255;

  // Update the style for map rendering
  geoTiffSource.updateStyle({
    color: [
      'interpolate',
      ['linear'],
      ['band', 1],
      min, [0, 0, 255],
      max, [255, 0, 0],
    ],
  });

  // Draw the legend gradient
  const canvas = document.getElementById('legend-canvas');
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const gradient = ctx.createImageData(w, h);

  for (let x = 0; x < w; x++) {
    const t = x / (w - 1);
    const [r, g, b, a] = currentRamp(t);
    for (let y = 0; y < h; y++) {
      const i = (y * w + x) * 4;
      gradient.data[i] = r;
      gradient.data[i + 1] = g;
      gradient.data[i + 2] = b;
      gradient.data[i + 3] = a;
    }
  }
  ctx.putImageData(gradient, 0, 0);
  document.getElementById('legend-min').innerText = Math.round(min);
  document.getElementById('legend-max').innerText = Math.round(max);
}

// ======== 11. Handle user ramp selection ========
document.getElementById('colorRampSelect').addEventListener('change', e => {
  currentRampName = e.target.value;
  currentRamp = colorRamps[currentRampName];
  updateLegend();
});
