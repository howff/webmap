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

// ======== 2. Color ramp definitions ========
const colorRamps = {
  Viridis: t => [68 + t * (253 - 68), 1 + t * (231 - 1), 84 + t * (37 - 84), 255],
  Magma: t => [Math.pow(t, 1.2) * 255, t * 80, 3 + t * 150, 255],
  Coolwarm: t => [59 + 196 * t, 76 + 96 * t, 192 - 152 * t, 255],
  Terrain: t => {
    if (t < 0.25) return [0, 128 + 127 * (t / 0.25), 0, 255];
    if (t < 0.5) return [255 * (t - 0.25) / 0.25, 255, 0, 255];
    if (t < 0.75) return [255, 255 * (0.75 - t) / 0.25, 0, 255];
    return [255, 255, 255 * (t - 0.75) / 0.25, 255];
  }
};
let currentRampName = 'Viridis';
let currentRamp = colorRamps[currentRampName];

// ======== 3. GeoTIFF source ========
const geoTiffSource = new GeoTIFF({
  sources: [{ url: 'https://example.com/my_custom_wkt_geotiff.tif' }],
  normalize: false,
  convertToRGB: false,
  style: { color: ['interpolate', ['linear'], ['band', 1], 0, [0, 0, 255], 255, [255, 0, 0]] },
});

// ======== 4. Layers & Map ========
const osmLayer = new TileLayer({ source: new OSM() });
const geoTiffLayer = new TileLayer({ source: geoTiffSource });
const map = new Map({
  target: 'map',
  layers: [osmLayer, geoTiffLayer],
  view: new View({ projection: 'EPSG:3857', center: [0, 0], zoom: 2 }),
});

// ======== 5. Progress bar ========
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

// ======== 6. Fit to extent and initialize ========
let minVal = 0, maxVal = 255;
geoTiffSource.on('change', async () => {
  if (geoTiffSource.getState() === 'ready') {
    const extent = geoTiffSource.getExtent();
    if (extent) {
      const reprojectedExtent = transformExtent(extent, localProjection, 'EPSG:3857');
      map.getView().fit(reprojectedExtent, { size: map.getSize(), padding: [20, 20, 20, 20] });
    }
    const image = await geoTiffSource.getImage();
    const stats = image.sampleStatistics?.[0] ?? {};
    minVal = stats.min ?? 0;
    maxVal = stats.max ?? 255;
    document.getElementById('minRange').min = minVal;
    document.getElementById('minRange').max = maxVal;
    document.getElementById('maxRange').min = minVal;
    document.getElementById('maxRange').max = maxVal;
    document.getElementById('minRange').value = minVal;
    document.getElementById('maxRange').value = maxVal;
    updateLegend();
  }
});

// ======== 7. Legend drawing function ========
function updateLegend() {
  const canvas = document.getElementById('legend-canvas');
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const imgData = ctx.createImageData(w, h);

  for (let x = 0; x < w; x++) {
    const t = x / (w - 1);
    const [r, g, b, a] = currentRamp(t);
    for (let y = 0; y < h; y++) {
      const i = (y * w + x) * 4;
      imgData.data[i] = r;
      imgData.data[i + 1] = g;
      imgData.data[i + 2] = b;
      imgData.data[i + 3] = a;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  document.getElementById('legend-min').innerText = Math.round(minVal);
  document.getElementById('legend-max').innerText = Math.round(maxVal);

  geoTiffSource.updateStyle({
    color: [
      'interpolate', ['linear'], ['band', 1],
      minVal, [0, 0, 255],
      maxVal, [255, 0, 0],
    ],
  });
}

// ======== 8. UI Interactions ========
document.getElementById('colorRampSelect').addEventListener('change', e => {
  currentRampName = e.target.value;
  currentRamp = colorRamps[currentRampName];
  updateLegend();
});

document.getElementById('minRange').addEventListener('input', e => {
  minVal = parseFloat(e.target.value);
  if (minVal >= maxVal) minVal = maxVal - 1;
  updateLegend();
});
document.getElementById('maxRange').addEventListener('input', e => {
  maxVal = parseFloat(e.target.value);
  if (maxVal <= minVal) maxVal = minVal + 1;
  updateLegend();
});
