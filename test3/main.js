import 'ol/ol.css';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import GeoTIFF from 'ol/source/GeoTIFF.js';
import TileLayer from 'ol/layer/WebGLTile.js';
import OSM from 'ol/source/OSM.js';
import proj4 from 'proj4';
import { register } from 'ol/proj/proj4.js';
import { get as getProjection, transformExtent } from 'ol/proj.js';

// ======== 1. Register the custom WKT CRS ========
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

// ======== 2. Create the GeoTIFF source ========
const geoTiffSource = new GeoTIFF({
  sources: [{ url: 'https://example.com/my_custom_wkt_geotiff.tif' }],
  normalize: true,
  convertToRGB: true,
});

// ======== 3. Layers ========
const geoTiffLayer = new TileLayer({ source: geoTiffSource });
const osmLayer = new TileLayer({ source: new OSM() });

// ======== 4. Map ========
const map = new Map({
  target: 'map',
  layers: [osmLayer, geoTiffLayer],
  view: new View({
    projection: 'EPSG:3857',
    center: [0, 0],
    zoom: 2,
  }),
});

// ======== 5. Progress Bar ========
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
    setTimeout(() => {
      document.getElementById('progress-container').style.display = 'none';
    }, 600);
  }
}

// ======== 6. Fit View and Update Legend ========
geoTiffSource.on('change', () => {
  if (geoTiffSource.getState() === 'ready') {
    const extent = geoTiffSource.getExtent();
    if (extent) {
      const reprojectedExtent = transformExtent(extent, localProjection, 'EPSG:3857');
      map.getView().fit(reprojectedExtent, { size: map.getSize(), padding: [20, 20, 20, 20] });
      generateLegend();
    }
  }
});

// ======== 7. Dynamic Color Legend ========
async function generateLegend() {
  try {
    const image = await geoTiffSource.getImage();
    const stats = image.sampleStatistics?.[0] ?? {};
    const min = stats.min ?? 0;
    const max = stats.max ?? 255;

    const canvas = document.getElementById('legend-canvas');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const gradient = ctx.createLinearGradient(0, 0, width, 0);

    // Create a smooth color ramp (blue → cyan → green → yellow → red)
    gradient.addColorStop(0.0, '#0000ff');
    gradient.addColorStop(0.25, '#00ffff');
    gradient.addColorStop(0.5, '#00ff00');
    gradient.addColorStop(0.75, '#ffff00');
    gradient.addColorStop(1.0, '#ff0000');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Update text values
    document.getElementById('legend-min').innerText = Math.round(min);
    document.getElementById('legend-max').innerText = Math.round(max);
  } catch (e) {
    console.warn('Error generating legend:', e);
  }
}
