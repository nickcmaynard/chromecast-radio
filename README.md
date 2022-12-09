# Chromecast Radio

There are two methods of running this - the pre-built container image, and from source.

## Pre-built container image

```sh
podman run -d --network host --env CC_NAME="My Chromecast" --env WEBAPP_TITLE="My Radio" ghcr.io/nickcmaynard/chromecast-radio:master
```

### Notes
* This will *not* run correctly without `--network host` as mdns broadcast/listening needs to be set up.
* This will *not* run correctly on a podman machine (a la `brew install podman`) as the mdns stuff won't work in that situation, either.

## From source

### Setup

Copy `.env.example` to `.env`, and edit for your environment.

```sh
npm install
npm install -g nodemon # Development only
```

### Development server

Run `DEBUG=Radio:* nodemon server` to start up the backend on `http://localhost:3000/`.
Run `npm run dev-frontend` to run the frontend dev server.  This will proxy backend requests to the backend.

Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

### Production

```sh
npm run build-frontend
npm run start
```

To run at startup via crontab:
```sh
@reboot cd ~/chromecast-radio ; /usr/bin/forever start -c /usr/bin/node server.js
```

## Notes

#### Station configuration
Station configuration is via `config/default.json`.  

Useful links for extending this:
* A radio player ID from http://www.radioplayer.co.uk.
* A stream URL (perhaps) from http://forums.linn.co.uk/bb/showthread.php?tid=29518&pid=348776#pid348776.

### Code state

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.6.3.

Adjusted according to https://medium.com/codingthesmartway-com-blog/building-an-angular-5-project-with-bootstrap-4-and-firebase-4504ff7717c1


# Credits
* Logo based on [icon](https://www.flaticon.com/free-icon/headphones_126508) from [Gregor Cesnar](https://www.flaticon.com/authors/gregor-cresnar) from [www.flaticon.com](https://www.flaticon.com).
