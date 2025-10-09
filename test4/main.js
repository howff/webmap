import 'ol/ol.css';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import GeoTIFF from 'ol/source/GeoTIFF.js';
import TileLayer from 'ol/layer/WebGLTile.js';
import OSM from 'ol/source/OSM.js';
import proj4 from 'proj4';
import { register } from 'ol/proj/proj4.js';
import { get as getProjection, transformExtent } from 'ol/proj.js';

// ======== 1. Register WKT CRS ========
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

// ======== 2. Define the shared color ramp ========
/**
 * Maps a normalized value [0,1] to an RGB color.
 * You can change the ramp to match your desired palette.
 */
function colorRamp(t) {
  const stops = [
    [0.0, [0, 0, 255]],    // blue
    [0.25, [0, 255, 255]], // cyan
    [0.5, [0, 255, 0]],    // green
    [0.75, [255, 255, 0]], // yellow
    [1.0, [255, 0, 0]],    // red
  ];
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [t0, c0] = stops[i - 1];
      const [t1, c1] = stops[i];
      const f = (t - t0) / (t1 - t0);
      const r = Math.round(c0[0] + f * (c1[0] - c0[0]));
      const g = Math.round(c0[1] + f * (c1[1] - c0[1]));
      const b = Math.round(c0[2] + f * (c1[2] - c0[2]));
      return [r, g, b, 255];
    }
  }
  return [255, 255, 255, 0];
}

// ======== 3. Create the GeoTIFF source with a style using colorRamp ========
const geoTiffSource = new GeoTIFF({
  sources: [{ url: 'https://example.com/my_custom_wkt_geotiff.tif' }],
  normalize: false,
  convertToRGB: false,
  style: {
    color: [
      'interpolate',
      ['linear'],
      ['band', 1],
      0, [0, 0, 255],
      128, [0, 255, 0],
      255, [255, 0, 0],
    ],
  },
});

// ======== 4. Layers ========
const geoTiffLayer = new TileLayer({ source: geoTiffSource });
const osmLayer = new TileLayer({ source: new OSM() });

// ======== 5. Map setup ========
const map = new Map({
  target: 'map',
  layers: [osmLayer, geoTiffLayer],
  view: new View({
    projection: 'EPSG:3857',
    center: [0, 0],
    zoom: 2,
  }),
});

// ======== 6. Progress Bar ========
const progressBar = document.getElementById('progress');
const progressText = document.getElementById('progress-text');
let tilesLoaded = 0;
let tilesTotal = 0;

geoTiffSource.on('tileloadstart', () => { tilesTotal++; updateProgress(); });
geoTiffSource.on('tileloadend', () => { tilesLoaded++; updateProgress(); });
geoTiffSource.on('tileloaderror', () => { tilesLoaded++; updateProgress(); });

function updateProgress() {
  if (tilesTotal === 0) return;
  const percent = Math.min(100, Math.round((tilesLoaded / tilesTotal) * 100));
  progressBar.style.width = `${percent}%`;
  progressText.innerText = `Loading GeoTIFF: ${percent}%`;
  if (percent === 100) {
    setTimeout(() => document.getElementById('progress-container').style.display = 'none', 600);
  }
}

// ======== 7. Fit View + Generate Legend ========
geoTiffSource.on('change', async () => {
  if (geoTiffSource.getState() === 'ready') {
    const extent = geoTiffSource.getExtent();
    if (extent) {
      const reprojectedExtent = transformExtent(extent, localProjection, 'EPSG:3857');
      map.getView().fit(reprojectedExtent, { size: map.getSize(), padding: [20, 20, 20, 20] });
    }
    await generateLegend();
  }
});

// ======== 8. Legend synced with map colors ========
async function generateLegend() {
  const image = await geoTiffSource.getImage();
  const stats = image.sampleStatistics?.[0] ?? {};
  const min = stats.min ?? 0;
  const max = stats.max ?? 255;

  const canvas = document.getElementById('legend-canvas');
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;

  const gradientCanvas = ctx.createImageData(w, h);
  for (let x = 0; x < w; x++) {
    const t = x / (w - 1);
    const [r, g, b, a] = colorRamp(t);
    for (let y = 0; y < h; y++) {
      const i = (y * w + x) * 4;
      gradientCanvas.data[i] = r;
      gradientCanvas.data[i + 1] = g;
      gradientCanvas.data[i + 2] = b;
      gradientCanvas.data[i + 3] = a;
    }
  }
  ctx.putImageData(gradientCanvas, 0, 0);
  document.getElementById('legend-min').innerText = Math.round(min);
  document.getElementById('legend-max').innerText = Math.round(max);
}
