//import 'ol/ol.css';
import { Map, View } from 'ol';
//import View from 'ol/View.js';
import GeoTIFF from 'ol/source/GeoTIFF.js';
import TileLayer from 'ol/layer/WebGLTile.js';
import OSM from 'ol/source/OSM.js';
import proj4 from 'proj4';
import { register } from 'ol/proj/proj4.js';
import { get as getProjection } from 'ol/proj.js';
import { transformExtent } from 'ol/proj.js';

// Attempt 2

//import Map from "https://cdn.jsdelivr.net/npm/ol@latest/Map.js"; // was ol/Map.js
//import View from "https://cdn.jsdelivr.net/npm/ol@latest/View.js"; // was ol/View.js
//import GeoTIFF from "https://cdn.jsdelivr.net/npm/ol@latest/source/GeoTIFF.js"; // was ol/source/GeoTIFF.js
//import TileLayer from "https://cdn.jsdelivr.net/npm/ol@latest/layer/Tile.js"; // was ol/layer/WebGLTile.js
//import OSM from "https://cdn.jsdelivr.net/npm/ol@latest/source/OSM.js"; // was ol/source/OSM.js

//import proj4 from "https://cdn.jsdelivr.net/npm/proj4@2.11.0/dist/proj4.js";
//import {register} from "https://cdn.jsdelivr.net/npm/ol@latest/proj/proj4.js";
//import {get as getProjection} from "https://cdn.jsdelivr.net/npm/ol@latest/proj.js";
//import { transformExtent } from 'https://cdn.jsdelivr.net/npm/ol@latest/proj.js'; // was ol/proj.js

// Attempt 3
//import Map from "https://esm.sh/ol@latest/Map.js";
//import View from "https://esm.sh/ol@latest/View.js";
//import GeoTIFF from "https://esm.sh/ol@latest/GeoTIFF.js";
//import TileLayer from "https://esm.sh/ol@latest/layer/Tile.js";
//import OSM from "https://esm.sh/ol@latest/source/OSM.js";
//import {register} from "https://esm.sh/ol@latest/proj/proj4.js";
//import proj4 from "https://esm.sh/proj4@2.11.0";
//import GeoTIFFSource from "https://esm.sh/ol@latest/source/GeoTIFF.js";


// Example WKT (replace this with the actual WKT from your GeoTIFF)
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

// 1️⃣ Register your custom WKT projection
proj4.defs('MY:LOCAL', myWKT);
register(proj4);
const localProjection = getProjection('MY:LOCAL');

// 2️⃣ Define GeoTIFF source (reads projection + pixels from file)
const geoTiffSource = new GeoTIFF({
  sources: [{
	  url: 'http://localhost:8000/ql_20251009-0938_METOP-B_dss2017_overview.tif',
  }],
  normalize: true,
  convertToRGB: true, // ensures color rendering
});

// 3️⃣ Create a WebGL tile layer for GeoTIFF
const geoTiffLayer = new TileLayer({
  source: geoTiffSource,
});

// 4️⃣ Add a base layer (OSM in EPSG:3857)
const osmLayer = new TileLayer({
  source: new OSM(),
});

// 5️⃣ Create the map
const map = new Map({
  target: 'map',
  layers: [osmLayer, geoTiffLayer],
  view: new View({
    projection: 'EPSG:3857',
    center: [0, 0],
    zoom: 2,
  }),
});

// 6️⃣ Wait until the GeoTIFF source loads, then fit view to its extent (reprojected)
geoTiffSource.on('change', () => {
  if (geoTiffSource.getState() === 'ready') {
    const extent = geoTiffSource.getExtent();
    if (extent) {
      const reprojectedExtent = transformExtent(extent, localProjection, 'EPSG:3857');
      map.getView().fit(reprojectedExtent, { size: map.getSize(), padding: [20, 20, 20, 20] });
    }
  }
});
