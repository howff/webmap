#!/bin/bash
# Start the Strava proxy server, can also take options: --verbose --target
/app/strava-heatmap-proxy --port 8080 --verbose &
# Replace the server's IP address in the web application
if [ "$SERVERIP" != "" ]; then
    sed -i "s/192.168.1.31/$SERVERIP/" map.html
fi
# Start the web server to serve map.html
python -m http.server 4330
