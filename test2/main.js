import 'ol/ol.css';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import GeoTIFF from 'ol/source/GeoTIFF.js';
import TileLayer from 'ol/layer/WebGLTile.js';
import OSM from 'ol/source/OSM.js';
import proj4 from 'proj4';
import { register } from 'ol/proj/proj4.js';
import { get as getProjection, transformExtent } from 'ol/proj.js';

// ======== 1. Define and register your WKT CRS ========
const myWKT = `
PROJCRS["unknown",
    BASEGEOGCRS["WGS 84",
        DATUM["World Geodetic System 1984",
            ELLIPSOID["WGS 84",6378137,298.257223563,
                LENGTHUNIT["metre",1]]],
        PRIMEM["Greenwich",0,
            ANGLEUNIT["degree",0.0174532925199433]],
        ID["EPSG",4326]],
    CONVERSION["Cassini-Soldner",
        METHOD["Cassini-Soldner",
            ID["EPSG",9806]],
        PARAMETER["Latitude of natural origin",54.00366,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8801]],
        PARAMETER["Longitude of natural origin",-2.547855,
            ANGLEUNIT["degree",0.0174532925199433],
            ID["EPSG",8802]],
        PARAMETER["False easting",0,
            LENGTHUNIT["metre",1],
            ID["EPSG",8806]],
        PARAMETER["False northing",0,
            LENGTHUNIT["metre",1],
            ID["EPSG",8807]]],
    CS[Cartesian,2],
        AXIS["easting",east,
            ORDER[1],
            LENGTHUNIT["metre",1,
                ID["EPSG",9001]]],
        AXIS["northing",north,
            ORDER[2],
            LENGTHUNIT["metre",1,
                ID["EPSG",9001]]]]
`;

proj4.defs('MY:LOCAL', myWKT);
register(proj4);
const localProjection = getProjection('MY:LOCAL');

// ======== 2. Define your GeoTIFF source ========
const geoTiffSource = new GeoTIFF({
  sources: [{
  url: 'http://localhost:4173/ql_20251009-0938_METOP-B_dssuk2017_overview.tif',
  }],
  normalize: true,
  convertToRGB: true,
});

// ======== 3. Create a GeoTIFF layer ========
const geoTiffLayer = new TileLayer({
  source: geoTiffSource,
});

// ======== 4. Base map layer (OSM) ========
const osmLayer = new TileLayer({
  source: new OSM(),
});

// ======== 5. Create the OpenLayers map ========
console.log(geoTiffSource.getView())
const map = new Map({
  target: 'map',
  //layers: [osmLayer, geoTiffLayer],
  layers: [geoTiffLayer],
	view: geoTiffSource.getView()
//  view: new View({
//    projection: 'EPSG:3857',
//    center: [0, 0],
//    zoom: 2,
//  }),
});

// ======== 6. Progress indicator ========
const progressBar = document.getElementById('progress');
const progressText = document.getElementById('progress-text');

let tilesLoaded = 0;
let tilesTotal = 0;

geoTiffSource.on('tileloadstart', () => {
  tilesTotal++;
  updateProgress();
});
geoTiffSource.on('tileloadend', () => {
  tilesLoaded++;
  updateProgress();
});
geoTiffSource.on('tileloaderror', () => {
  tilesLoaded++;
  updateProgress();
});

function updateProgress() {
  if (tilesTotal === 0) return;
  const percent = Math.min(100, Math.round((tilesLoaded / tilesTotal) * 100));
  progressBar.style.width = `${percent}%`;
  progressText.innerText = `Loading GeoTIFF: ${percent}%`;
  if (percent === 100) {
    setTimeout(() => {
      document.getElementById('progress-container').style.display = 'none';
    }, 500);
  }
}

// ======== 7. Fit view to GeoTIFF extent when ready ========
geoTiffSource.on('change', () => {
  if (geoTiffSource.getState() === 'ready') {
    const extent = geoTiffSource.getTileGrid().getExtent();
    if (extent) {
	    console.log('hello');
      const reprojectedExtent = transformExtent(extent, localProjection, 'EPSG:3857');
      map.getView().fit(reprojectedExtent, { size: map.getSize(), padding: [20, 20, 20, 20] });
      //updateLegend(); // getImage is not a function so don't call this
    }
  }
});

// ======== 8. Simple Legend based on GeoTIFF pixel range ========
async function updateLegend() {
  try {
    const tiff = await geoTiffSource.getImage();
    const min = tiff.sampleStatistics?.[0]?.min ?? 0;
    const max = tiff.sampleStatistics?.[0]?.max ?? 255;

    document.getElementById('legend-min').innerText = Math.round(min);
    document.getElementById('legend-max').innerText = Math.round(max);
  } catch (e) {
    console.warn('Unable to get GeoTIFF range:', e);
  }
}
