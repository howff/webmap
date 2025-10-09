import Map from 'ol/Map.js';
import TileLayer from 'ol/layer/WebGLTile.js';
import GeoTIFF from 'ol/source/GeoTIFF.js';

const source = new GeoTIFF({
  sources: [
    {
      url: 'http://localhost:4173/ql_20250120-1124_METOP-C_ap67_r135a.tif'
      //url: 'http://localhost:8000/TCI.tif'
       //url: 'http://localhost:4173/TCI.tif'
    },
  ],
});

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: source,
    }),
  ],
  view: source.getView(),
});

