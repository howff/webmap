#!/bin/bash
# Start the docker container which runs a strava proxy
# It requires my cookies in ~/.config/strava-heatmap-proxy/strava-cookies.json
# and runs a strava heatmap tile server on port 4331 (=heet).

sudo docker run --rm -p 4331:8080 -d --name strava -v ~/.config/strava-heatmap-proxy:/config:ro docker.io/patrickziegler/strava-heatmap-proxy:latest
