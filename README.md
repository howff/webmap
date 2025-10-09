# webmap

A sample file is
https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/36/Q/WD/2020/7/S2A_36QWD_20200701_0_L2A/TCI.tif

## Install nodejs npm

```
wget https://nodejs.org/dist/v22.20.0/node-v22.20.0-linux-x64.tar.xz
tar xf node-v22.20.0-linux-x64.tar.xz
export PATH=${PATH}:$(pwd)/node-v22.20.0-linux-x64/bin
```

## Create a test directory

```
mkdir test1
cd test1
npm init -y
sed -i '/"scripts"/a"dev": "vite", "build": "vite build", "serve": "vite preview",' package.json
```

## Create the source code

Create index.html and main.js

Reference main.js in your index.html `<script type="module" src="main.js"></script>`

Make sure the geotiff referenced in the js has a URL that is local (correct port and path) e.g. `http://localhost:4173/`

```
npm install ol proj4
npm install --save-dev vite # it's only a development dependency not needed for deployment
```

## Build

Use `npm run build` which creates a `dist` directory, then run a web server in that directory.
It must support CORS and other features which a COG file needs (chunking?).
`python -m http.server` doesn't do CORS. Try a subclass, see `httpd.py` but even that doesn't work for COG files.

```
npm run build && ../createsymlinks.sh && (cd dist ; npm run serve --host --cors)
```
