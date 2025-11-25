# Strava Heatmap and Ordnance Survey Maps

Run a proxy which can pull heatmap tiles from Strava
https://github.com/patrickziegler/strava-heatmap-proxy
```
sudo docker pull docker.io/patrickziegler/strava-heatmap-proxy
```

Install Chrome extension
https://chromewebstore.google.com/detail/strava-cookie-exporter/apkhbbckeaminpphaaaabpkhgimojlhk

Grab strava cookies (format will be like `[ { "name":xx, "value":yy } ]`)
and store in `~/.config/strava-heatmap-proxy/strava-cookies.json`

To run the proxy use `start_strava_proxy.sh` which does this:
```
sudo docker run --rm -p 8080:8080 -d --name strava -v ~/.config/strava-heatmap-proxy:/config:ro docker.io/patrickziegler/strava-heatmap-proxy:latest
```

Strava tiles might look like this:
https://content-a.strava.com/identified/globalheat/run/mobileblue/13/4004/2520@2x.png?v=19
but the proxy allow you use get them via
http://localhost:8080/identified/globalheat/all/bluered/%1/%2/%3.png?v=19

Use a simple web page which shows the heatmap on top of OS maps using OpenLayers.
Configure the OS Maps API key in `website/map.html` and edit the address/port number
in the strava URL template.
Run a web server `start_map_server.sh` which does this:
```
cd website
python -m http.server 4330
```
Browse to http://localhost:4330/

Combine both into a single container:
* inside container run proxy on port 8080
* inside container run web server on port 4330
* run container with -p 4330:4330 -p 4331:8080

Build container:
```
sudo docker build -t strava_os_proxy .
```

Run container with `start_container.sh` which does this:
```
sudo docker run -e SERVERIP --rm -p 4330:4330 -p 4331:8080 -d --name strava_os_proxy \
    -v ~/.config/strava-heatmap-proxy:/root/.config/strava-heatmap-proxy:ro \
    strava_os_proxy
```
It finds out your local IP address and passes it to the container via an environment variable:
```
SERVERIP=$(ip addr | sed -n '/192\./s/^.*\(192\.[0-9]*\.[0-9]*\.[0-9]*\)\/.*/\1/p')
```
That variable is used in the container's entrypoint script
to edit the proxy URL template in the HTML page.


## Heatmap colours

Can be changed in map.html

* mobileblue
* gray
* bluered
* hot
* purple
* orange

## Heatmap Activity selection

Can be changed in map.html, and is done by a radio button

* all: all activities
* run: all foot sport activities (Run, Trail Run, Walk, Hike). The name is misleading for historical reasons.
sport_Run: just "Run" activities
sport_TrailRun: just "Trail Run" activities
sport_Walk
sport_Hike
* ride: all cycle activities (those listed below)
sport_Ride
sport_MountainBikeRide
sport_GravelRide
sport_EBikeRide
sport_EMountainBikeRide
sport_Velomobile
* water: all water activities (those listed below)
sport_Canoeing
sport_Kayaking
sport_Kitesurf
sport_Rowing
sport_Sail
sport_StandUpPaddling
sport_Surfing
sport_Swim
sport_Windsurf
* winter: all winter activities (those listed below)
sport_AlpineSki
sport_BackcountrySki
sport_IceSkate
sport_NordicSki
sport_Snowboard
sport_Snowshoe
sport_Badminton
sport_Golf
sport_Handcycle
sport_InlineSkate
sport_Pickleball
sport_RockClimbing
sport_RollerSki
sport_Skateboard
sport_Soccer
sport_Tennis
sport_Wheelchair

## OS Maps API

Leisure tiles are like this: https://api.os.uk/maps/raster/v1/zxy/Leisure_27700/{z}/{x}/{y}.png?key=

See https://docs.os.uk/os-apis/accessing-os-apis/os-maps-api/layers-and-styles
for layer names, styles, resolutions, scales, zoom levels

See https://labs.os.uk/public/os-data-hub-examples/os-maps-api/zxy-27700-basic-map#openlayers
for openlayers code


## CORS (not needed)

Web clients like gpx.studio need to be whitelisted via the --allow-origins option. Otherwise the browser would reject the responses due to a violation of the same-origin policy.

```
strava-heatmap-proxy --allow-origins '["https://gpx.studio"]' --port 8080
```
Then configure gpx.studio layer:
http://localhost:8080/identified/globalheat/all/bluered/{z}/{x}/{y}.png?v=19


## Install NODE (not needed)

```
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
```

Install nsolid or nodejs
```
sudo apt-get install -y nsolid
nsolid -v
OR
sudo apt-get install -y nodejs
node -v
```

Run a web server
```
cd dist
npm run serve --host --cors
```


## TO DO

* allow drag and drop a gpx file onto the map
* allow file explorer to choose a gpx file
* allow drag and drop a new cookies file, or file explorer to choose a json file
