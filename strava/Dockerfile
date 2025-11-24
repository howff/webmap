FROM docker.io/patrickziegler/strava-heatmap-proxy:latest AS proxy
FROM python:3.12
COPY --from=0 /app/strava-heatmap-proxy /app/strava-heatmap-proxy
COPY website/map.html /app
WORKDIR /app
ENTRYPOINT /app/strava-heatmap-proxy & python -m http.server 4330
