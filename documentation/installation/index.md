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

* Node.js (version 20 or later) which provides the npm command
* git
* A web browser to verify the build

Next step is to download the frontend repository from GitHub. To do this, execute the following command in a directory of your choice:

```bash
git clone git@github.com:Oxalate-Portal/oxalate-frontend.git
cd oxalate-frontend
```

Once the repository has been downloaded, you should create an environment file that will contain the configuration for the frontend. To do this, open with
your editor of choice the file `env` and save it as `.env.local`, or `.env.production` depending of your use case, in the same directory. With modifying this
file, you can modify the following parts of the frontend:

| Variable                           | Description                                                                                                 |
|------------------------------------|-------------------------------------------------------------------------------------------------------------|
| REACT_APP_API_URL                  | The URL to the backend service. This is the URL that the frontend will use to communicate with the backend. |
| REACT_APP_OXALATE_PAGE_TITLE       | The title of the page. This will be shown in the browser tab.                                               |
| REACT_APP_OXALATE_COPYRIGHT_FOOTER | The copyright part of the footer.                                                                           |
| REACT_APP_POWERED_BY_OXALATE       | The powered by part of the footer.                                                                          |
| REACT_APP_RECAPTCHA_SITE_KEY       | The site key for the reCAPTCHA service. This is used to verify that the user is not a robot.                |

In case you're building a production setup, then you need to also set up the Google Captcha v3. Go to the
[Google reCAPTCHA admin page](https://www.google.com/recaptcha/admin/create) and follow the instructions there.

## Building the frontend

To build the frontend, first execute the following commands:

```bash
npm install
```

This will fetch the modules required by the frontend and install them in the `node_modules` directory.

Depending on whether you then want to test the portal locally or build it for production, you can execute one of the following commands:

```bash
npm start
```

This will start a local web server that will serve the frontend on port 3000. You can then open a web browser and go to http://localhost:3000 to see the
portal. Note that you should also have the [backend service running](https://github.com/Oxalate-Portal/oxalate-backend/blob/main/documentation/installation/index.md#build-and-run-locally)
in order to be able to fully use the frontend. This requires that you have created the `.env.local` file first.

Alternatively, you can build the frontend for production by executing the following command:

```bash
npm run build:production
```

This will build the frontend and place the resulting files in the `build` directory. You can then copy the contents of this directory to a web server and serve
it from there. This requires that you have created the `.env.production` file first.

## Modifications

The frontend has a few details that can be modified to fit your needs. The logo and the background image, as well as the title/name of the site. The latter is
modified by creating the appropriate `.env` file as described above.

### Images

Once you have built the production version of the frontend, you can modify the images in the `build/static/media` directory. The logo is named
`portal_logo.*.svg` and the background image is named `background.*.jpg`. The `*` is a hash that is generated when the frontend is built. Just copy your
images over the existing ones and you're done.

## Setups

Setting up the frontend in a production environment can be done in two different ways. You can either run it natively on a web server, or you can run it in a
container.

### Native

This requires that you have a web server installed and running. The web server should be configured to serve the files in a specific directory to which you
will then copy the build files which you built according to the instructions above. You can use any web server you want, as long as it can be configured
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
docker run -d -p 3000:3000 --name oxalate-frontend oxalate-frontend
```

This will start the container and expose port 3000 on the host. You can then open a web browser and go to http://localhost:3000 to see the portal. Again,
remember that you should also have the backend service running.

**NOTE!** This is not a production setup. You should not use this in a production environment. This is only meant for testing purposes and as an example on how
to set up the Portal. If you intend on running the frontend in a container in a production environment, you should use a web server container such as Nginx
and serve only the static files from the build.