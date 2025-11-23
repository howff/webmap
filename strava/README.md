https://github.com/patrickziegler/strava-heatmap-proxy

Install Chrome extension
https://chromewebstore.google.com/detail/strava-cookie-exporter/apkhbbckeaminpphaaaabpkhgimojlhk
grab strava cookies (format will be like [ { "name":xx, "value":yy } ]
store in ~/.config/strava-heatmap-proxy/strava-cookies.json

Run proxy
sudo docker pull docker.io/patrickziegler/strava-heatmap-proxy
sudo docker run --rm -p 8080:8080 -d --name strava -v ~/.config/strava-heatmap-proxy:/config:ro docker.io/patrickziegler/strava-heatmap-proxy:latest

Write web page
http://localhost:8080/identified/globalheat/all/bluered/%1/%2/%3.png?v=19

e.g. from my browser inspect
https://content-a.strava.com/identified/globalheat/run/mobileblue/13/4004/2520@2x.png?v=19


CORS
----
Web clients like gpx.studio need to be whitelisted via the --allow-origins option. Otherwise the browser would reject the responses due to a violation of the same-origin policy.

strava-heatmap-proxy --allow-origins '["https://gpx.studio"]' --port 8080
Then configure gpx.studio layer:
http://localhost:8080/identified/globalheat/all/bluered/{z}/{x}/{y}.png?v=19


Colour selection

mobileblue
gray
bluered
hot
purple
orange

Activity selection:

all: all activities
run: all foot sport activities (Run, Trail Run, Walk, Hike). The name is misleading for historical reasons.
sport_Run: just "Run" activities
sport_TrailRun: just "Trail Run" activities
sport_Walk
sport_Hike
ride: all cycle activities (those listed below)
sport_Ride
sport_MountainBikeRide
sport_GravelRide
sport_EBikeRide
sport_EMountainBikeRide
sport_Velomobile
water: all water activities (those listed below)
sport_Canoeing
sport_Kayaking
sport_Kitesurf
sport_Rowing
sport_Sail
sport_StandUpPaddling
sport_Surfing
sport_Swim
sport_Windsurf
winter: all winter activities (those listed below)
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



----------------------------------------------------------------

Ordnance Survey maps

key = HiKqP4vPPc1kZEOfFrtoqPLaN4qo4S0B
secret = ZLDPnJ7v790MhgUk

Leisure is https://api.os.uk/maps/raster/v1/zxy/Leisure_27700/{z}/{x}/{y}.png?key=HiKqP4vPPc1kZEOfFrtoqPLaN4qo4S0B

See https://docs.os.uk/os-apis/accessing-os-apis/os-maps-api/layers-and-styles
for layer names, styles, resolutions, scales, zoom levels

See https://labs.os.uk/public/os-data-hub-examples/os-maps-api/zxy-27700-basic-map#openlayers
for openlayers code

----------------------------------------------------------------

python -m http.server

http://192.168.1.30:8000/os_official.html


----------------------------------------------------------------


Install NODE

curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -

sudo apt-get install -y nsolid
nsolid -v
OR
sudo apt-get install -y nodejs
node -v

cd dist
npm run serve --host --cors
