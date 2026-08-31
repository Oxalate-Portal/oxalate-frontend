<!--ts-->
* [Installation of Oxalate frontend](#installation-of-oxalate-frontend)
   * [Prerequisites](#prerequisites)
   * [Building the frontend](#building-the-frontend)
   * [Modifications](#modifications)
      * [Images](#images)
   * [Setups](#setups)
      * [Native](#native)
      * [Container](#container)

<!-- Created by https://github.com/ekalinin/github-markdown-toc -->
<!-- Added by: poltsi, at: Fri Jan 26 07:19:10 PM EET 2024 -->

<!--te-->

# Installation of Oxalate frontend

**NOTE!** These instructions will for the moment only cover how to set up and run the backend service in a Linux environment whether natively or in a container.

The frontend is a React application that can be built and run in a container or natively. The end result of building the frontend is a group of files
that can then be placed into a directory for the native web server to find, or into a container (running a web server or Node) that can be run.

## Prerequisites

First you need to have the necessary tools installed to build the frontend. The following tools are needed:

* Node.js (version 20 or later) with Corepack enabled, which provides Yarn
* git
* A web browser to verify the build

Next step is to download the frontend repository from GitHub. To do this, execute the following command in a directory of your choice:

```bash
git clone git@github.com:Oxalate-Portal/oxalate-frontend.git
cd oxalate-frontend
```

Once the repository has been downloaded, copy `env` to `.env.local` for development or use the checked-in `.env.production` values as build defaults. These
values are compiled into the application and should not be used for deployment-specific settings when sharing one image between environments.

| Variable                          | Description                                                                                                 |
|-----------------------------------|-------------------------------------------------------------------------------------------------------------|
| VITE_APP_API_URL                  | The URL to the backend service. This is the URL that the frontend will use to communicate with the backend. |
| VITE_APP_OXALATE_PAGE_TITLE       | The title of the page. This will be shown in the browser tab.                                               |
| VITE_APP_OXALATE_COPYRIGHT_FOOTER | The copyright part of the footer.                                                                           |
| VITE_APP_POWERED_BY_OXALATE       | The powered by part of the footer.                                                                          |
| VITE_APP_RECAPTCHA_SITE_KEY       | The site key for the reCAPTCHA service. This is used to verify that the user is not a robot.                |

In case you're building a production setup, then you need to also set up the Google Captcha v3. Go to the
[Google reCAPTCHA admin page](https://www.google.com/recaptcha/admin/create) and follow the instructions there.

## Building the frontend

To build the frontend, first execute the following commands:

```bash
corepack enable
corepack prepare yarn@4.13.0 --activate
yarn install
```

This will fetch the modules required by the frontend and install them in the `node_modules` directory.

Depending on whether you then want to test the portal locally or build it for production, you can execute one of the following commands:

```bash
yarn start
```

This will start a local web server that will serve the frontend on port 3000. You can then open a web browser and go to http://localhost:3000 to see the
portal. Note that you should also have the [backend service running](https://github.com/Oxalate-Portal/oxalate-backend/blob/main/documentation/installation/index.md#build-and-run-locally)
in order to be able to fully use the frontend. This requires that you have created the `.env.local` file first.

Alternatively, you can build the frontend for production by executing the following command:

```bash
yarn build:production
```

This will build the frontend and place the resulting files in the `dist` directory. The `.env.production` values provide defaults for the image. Runtime
configuration should be used to customize each deployment without rebuilding.

## Modifications

The frontend has a few details that can be modified to fit your needs. The logo and the background image, as well as the title/name of the site. The latter is
modified by creating the appropriate `.env` file as described above.

### Runtime configuration and images

The production image contains stable deployment asset paths under `/site-files/`. Replace these files with the organization's `background.jpg`,
`navbar-logo.svg`, `favicon.ico`, and `logo192.png` files. The files may be mounted over the image's `/usr/share/nginx/html/site-files/` directory (or copied to
the equivalent native web-server directory); no application rebuild is required.

The file `/runtime-config.js` is loaded before React starts. It is a JavaScript file, not JSON, and must assign an object to
`window.__OXALATE_RUNTIME_CONFIG__`:

```javascript
window.__OXALATE_RUNTIME_CONFIG__ = {
    apiUrl: "/api",
    recaptchaSiteKey: "deployment-site-key",
    pageTitle: "Organization Portal",
    copyrightFooter: "Organization © 2026",
    poweredByOxalate: "Powered by <a href=\"https://oxalate.io/\">Oxalate Portal</a>",
    backgroundUrl: "/site-files/background.jpg",
    logoUrl: "/site-files/navbar-logo.svg",
    faviconUrl: "/site-files/favicon.ico",
    appleTouchIconUrl: "/site-files/logo192.png"
};
```

The first five properties correspond to the `VITE_APP_*` values documented above. The default runtime file in `public/runtime-config.js` is an empty override,
so the build defaults are used. Keep this file uncached (the supplied Nginx config does so) so changes take effect immediately.

## Setups

Setting up the frontend in a production environment can be done in two different ways. You can either run it natively on a web server, or you can run it in a
container.

### Native

This requires that you have a web server installed and running. The web server should be configured to serve the files in a specific directory to which you will
then copy the build files and deployment files described above. You can use any web server you want, as long as it can be configured
to also forward requests to the backend service (i.e. function as a reverse proxy). We recommend using Nginx. We have a template configuration for
Nginx located in the [templates](../../templates) directory. Note that the configuration file is a Jinja2 template, which should be helpful if you want to
use the file later in an Ansible setup. In case of a static installation, you need to replace the bracketed values with the correct values for your environment.

In case of other web servers, please refer to the documentation of the web server on how to configure it.

### Container

The frontend can also be run in a container. This requires that you have a container runtime installed and running. We recommend using Docker. In the root of
the repository we have a simple Dockerfile that can be used to build a container image. To build the image, execute the following command:

```bash
docker build -t oxalate-frontend .
```

This should generate a docker image called `oxalate-frontend`. You can then run the container with the following command:

```bash
docker run -d -p 8080:8080 \
  -v "$PWD/runtime-config.js:/usr/share/nginx/html/runtime-config.js:ro" \
  -v "$PWD/site-files:/usr/share/nginx/html/site-files:ro" \
  --name oxalate-frontend ghcr.io/oxalate-portal/oxalate-frontend:latest
```

This serves the same image on port 8080 with deployment-specific configuration and branding. Local, stage, and production deployments can use different mounted
files without modifying the application image.