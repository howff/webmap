import 'ol/ol.css';
import { Map, View } from 'ol';
import GeoTIFF from 'ol/source/GeoTIFF.js';
import { WebGLTile as WebGLTileLayer } from 'ol/layer.js';
import proj4 from 'proj4';
import { register } from 'ol/proj/proj4.js';
import { get as getProjection } from 'ol/proj.js';

// 🔹 Register proj4 with OpenLayers
register(proj4);

// 🔹 Define a custom projection (example: EPSG:3035)
proj4.defs(
  'EPSG:3035',
  '+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +units=m +no_defs'
);

const customProj = getProjection('EPSG:3035');
console.log('Custom projection registered:', customProj);

// 🔹 Local GeoTIFF file
//const geotiffUrl = 'http://localhost:8000/ql_20250120-1124_METOP-C_ap67_r135a.tif';
const geotiffUrl = 'https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/36/Q/WD/2020/7/S2A_36QWD_20200701_0_L2A/TCI.tif';

const layer = new WebGLTileLayer({
  source: new GeoTIFF({
    sources: [{ url: geotiffUrl }]
  })
});

const map = new Map({
  target: 'map',
  layers: [layer],
  view: new View({
    projection: customProj,
    center: [0, 0],
    zoom: 2
  })
});

// Optional: zoom to the raster extent when loaded
layer.getSource().on('ready', () => {
  const extent = layer.getSource().getView().getProjection().getExtent();
  if (extent) {
    map.getView().fit(extent, { size: map.getSize(), maxZoom: 10 });
  }
});
