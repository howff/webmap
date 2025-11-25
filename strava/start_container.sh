#!/bin/bash
# Find out our IP address and pass it into the container as an environment variable
SERVERIP=$(ip addr | sed -n '/192\./s/^.*\(192\.[0-9]*\.[0-9]*\.[0-9]*\)\/.*/\1/p')
# Start the container
sudo docker run -e SERVERIP --rm -p 4330:4330 -p 4331:8080 -d --name strava_os_proxy \
	-v ~/.config/strava-heatmap-proxy:/root/.config/strava-heatmap-proxy:ro strava_os_proxy
