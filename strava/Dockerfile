# Build with: sudo docker build -t strava_os_proxy .
# Run with:   sudo docker run --rm -d --name strava_os_proxy -p 4330:4330 -v -v ~/.config/strava-heatmap-proxy:/root/.config:ro strava_os_proxy
#
# Pull in the compiled app
FROM docker.io/patrickziegler/strava-heatmap-proxy:latest AS proxy
# Now replace it by a generic Python
FROM python:3.12
# Copy the strava app from the previous layer
COPY --from=0 /app/strava-heatmap-proxy /app/strava-heatmap-proxy
# Copy the web app into the container
COPY website/map.html /app/
COPY entrypoint.sh /app/
## Modify the strava URL template to query localhost (inside the container) not a separate instance on the VM
#RUN sed -i '/heatmap_url_template/s/192.168.1.30:4331/localhost:8080/' /app/map.html
WORKDIR /app
# Run the strava app in the background then run the web server
# It will use $SERVERIP in the HTML if you pass in that env var
ENTRYPOINT /app/entrypoint.sh
