# Frontend customization

The frontend application image is shared by all deployments. Organization-specific settings and branding are supplied at runtime, so local, stage, and
production deployments can use different values without rebuilding the application source or Docker image.

## 1. Choose the deployment image

Use the published image when available:

```text
ghcr.io/oxalate-portal/oxalate-frontend:latest
```

The image serves the frontend with NGINX on port `8080`.

## 2. Create a runtime configuration file

Create a file named `runtime-config.js`. It must assign an object to
`window.__OXALATE_RUNTIME_CONFIG__`:

```javascript
window.__OXALATE_RUNTIME_CONFIG__ = {
    apiUrl: "/api",
    recaptchaSiteKey: "your-recaptcha-site-key",
    pageTitle: "Organization Portal",
    copyrightFooter: "Organization © 2026",
    poweredByOxalate: "Powered by <a href=\"https://oxalate.io/\">Oxalate Portal</a>",
    backgroundUrl: "/site-files/background.jpg",
    logoUrl: "/site-files/navbar-logo.svg",
    faviconUrl: "/site-files/favicon.ico",
    appleTouchIconUrl: "/site-files/logo192.png"
};
```

The file is loaded before React starts. Use valid JavaScript and do not wrap the object in JSON quotes.

### Configuration properties

| Property            | Purpose                                                       |
|---------------------|---------------------------------------------------------------|
| `apiUrl`            | Backend API URL, such as `/api` or `https://api.example.test` |
| `recaptchaSiteKey`  | Google reCAPTCHA v3 site key for the deployment               |
| `pageTitle`         | Text shown in the browser tab                                 |
| `copyrightFooter`   | Copyright HTML displayed in the footer                        |
| `poweredByOxalate`  | Powered-by HTML displayed in the footer                       |
| `backgroundUrl`     | URL of the organization background image                      |
| `logoUrl`           | URL of the navigation-bar logo                                |
| `faviconUrl`        | URL of the browser favicon                                    |
| `appleTouchIconUrl` | URL of the mobile/apple touch icon                            |

The footer properties accept HTML because the existing footer supports links. Only place trusted, deployment-controlled content in these properties.

If a property is omitted, the frontend uses its build default. In the vanilla Docker image, the default branding URLs point to `/site-files/background.jpg`,
`/site-files/navbar-logo.svg`, `/site-files/favicon.ico`, and
`/site-files/logo192.png`. The checked-in `public/runtime-config.js`
intentionally contains an empty override object.

## 3. Prepare branding files

Create a `site-files` directory containing the deployment branding:

```text
site-files/
├── background.jpg
├── favicon.ico
├── logo192.png
└── navbar-logo.svg
```

The filenames are conventional; the URLs in `runtime-config.js` may point to different names or locations if required. The Docker image includes default files
at `/site-files/`, which can be replaced by deployment files.

## 4. Run a customized Docker deployment

Keep `runtime-config.js` and `site-files/` outside the application image. Mount them as read-only volumes:

```bash
docker run -d \
  --name oxalate-frontend \
  -p 8080:8080 \
  -v "$PWD/runtime-config.js:/usr/share/nginx/html/runtime-config.js:ro" \
  -v "$PWD/site-files:/usr/share/nginx/html/site-files:ro" \
  ghcr.io/oxalate-portal/oxalate-frontend:latest
```

Open `http://localhost:8080` to verify the deployment. For stage and production, use separate directories, for example:

```text
deployments/
├── local/
│   ├── runtime-config.js
│   └── site-files/
├── stage/
│   ├── runtime-config.js
│   └── site-files/
└── production/
    ├── runtime-config.js
    └── site-files/
```

Each directory can use a different API URL, reCAPTCHA key, title, footer, and branding while all three deployments use the same image tag.

### Docker Compose

Create `compose.yaml` next to the deployment-specific `runtime-config.js` and `site-files/` directory:

```yaml
services:
    frontend:
        image: ghcr.io/oxalate-portal/oxalate-frontend:latest
        ports:
            - "8080:8080"
        volumes:
            - ./runtime-config.js:/usr/share/nginx/html/runtime-config.js:ro
            - ./site-files:/usr/share/nginx/html/site-files:ro
        restart: unless-stopped
```

Start it with:

```bash
docker compose up -d
```

The mounted `runtime-config.js` overrides the `.env.production`-derived defaults, and the mounted `site-files/` directory replaces the vanilla image's branding.
To update a deployment, replace those files and restart the service or reload the page after ensuring the new runtime file is being served.

## 5. Build the current code into the local Docker image store

Use this workflow when developing or testing a checkout with the local Docker engine. No separate Docker registry is required. `docker build` automatically
uploads the resulting image into the local Docker image store, where Compose can use it directly.

### 5.1 Build the frontend files

From the repository root, install dependencies and create the production build:

```bash
corepack enable
corepack prepare yarn@4.13.0 --activate
yarn install
yarn build:production
```

The Dockerfile copies the generated `dist/` directory into the NGINX image. Do not copy deployment-specific `runtime-config.js` or branding files into
`dist/`; those remain runtime overrides.

### 5.2 Build and tag the image

Set an image name and tag, then build from the current source tree:

```bash
IMAGE=oxalate-frontend
TAG="$(git rev-parse --short HEAD)"

docker build --tag "$IMAGE:$TAG" .
docker tag "$IMAGE:$TAG" "$IMAGE:latest"
```

The image contains the current application build, NGINX configuration, and vanilla files under `/site-files/`. Confirm that the local Docker engine has both
tags:

```bash
docker image inspect "$IMAGE:$TAG"
docker image ls "$IMAGE"
```

### 5.3 Run the local image with Docker Compose

Update the Compose file's `image` value to the local tag:

```yaml
services:
    frontend:
        image: oxalate-frontend:latest
```

Because the image is already in the local Docker image store, do not run
`docker compose pull`. Start it directly:

```bash
docker compose up -d
```

To rebuild after source or Dockerfile changes:

```bash
docker build --tag "$IMAGE:$TAG" .
docker tag "$IMAGE:$TAG" "$IMAGE:latest"
docker compose up -d --force-recreate
```

## 6. Customize a native NGINX deployment

Build the frontend once:

```bash
yarn install
yarn build:production
```

Copy the contents of `dist/` to the directory served by NGINX. Copy the deployment-specific `runtime-config.js` to the root of that directory and copy the
branding files to its `site-files/` subdirectory:

```text
<frontend-root>/
├── runtime-config.js
├── site-files/
│   ├── background.jpg
│   ├── favicon.ico
│   ├── logo192.png
│   └── navbar-logo.svg
└── ...
```

Use `templates/nginx.conf.j2` as the NGINX template. It already serves
`runtime-config.js` with `Cache-Control: no-store`, ensuring configuration changes are not held in a browser or proxy cache.

## 7. Understand build-time environment defaults

The following `.env.production` values remain available as fallback defaults:

```text
VITE_APP_API_URL
VITE_APP_RECAPTCHA_SITE_KEY
VITE_APP_OXALATE_PAGE_TITLE
VITE_APP_OXALATE_COPYRIGHT_FOOTER
VITE_APP_POWERED_BY_OXALATE
```

Vite normally compiles environment variables into JavaScript during the build. Therefore, changing `.env.production` after the image is built does not change a
running deployment. Use `runtime-config.js` for deployment-specific values.

For local development, use `.env.local` as usual:

```bash
cp .env .env.local
yarn start
```

When running the Vite development server, serve any runtime branding files from the development server's `public/` directory or omit the branding URL overrides
to use the source assets.

## 8. Verify a customization

After starting a deployment:

1. Open `/runtime-config.js` in the browser and confirm that the expected configuration is being served.
2. Confirm that `/site-files/background.jpg`,
   `/site-files/navbar-logo.svg`, `/site-files/favicon.ico`, and
   `/site-files/logo192.png` return the deployment files.
3. Reload the frontend and check the browser title, navigation logo, background, favicon, footer, and API-backed pages.
4. Confirm that the reCAPTCHA key matches the deployed hostname.

Do not put private credentials or API secrets in this file. Browser-delivered configuration, including the reCAPTCHA site key, is public by design.
