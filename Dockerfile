# Use nginx alpine as base image for lightweight container
FROM nginx:alpine

# Create custom nginx config to serve static files and proxy API requests
RUN cat > /etc/nginx/conf.d/default.conf <<'EOL'
server {
    listen 8080;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    location = /runtime-config.js {
        root /usr/share/nginx/html;
        add_header Cache-Control "no-store";
    }
}
EOL

# Copy built React app from dist directory to nginx html directory
COPY dist/ /usr/share/nginx/html/

# Stable deployment asset paths; these can be replaced by a mounted site-files directory.
RUN mkdir -p /usr/share/nginx/html/site-files
COPY src/background.jpg /usr/share/nginx/html/site-files/background.jpg
COPY src/portal_logo.svg /usr/share/nginx/html/site-files/navbar-logo.svg
COPY public/favicon.ico /usr/share/nginx/html/site-files/favicon.ico
COPY public/logo192.png /usr/share/nginx/html/site-files/logo192.png

# Expose port 8080 for external access
EXPOSE 8080

# Start nginx in foreground mode (proper for containerized applications)
CMD ["nginx", "-g", "daemon off;"]