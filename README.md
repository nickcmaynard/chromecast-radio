# Chromecast Radio

## Setup

Copy `.env.example` to `.env`, and edit for your environment.

```
npm install
npm install -g nodemon # Development only
```

### Required libraries
The NodeJS package mdns has some prereqs, meaning `npm install` may fail if they're not installed, complaining about a missing file `dns_sd.h`.

Run this and retry:
`sudo apt install libavahi-compat-libdnssd-dev`

## Development server

Run `DEBUG=Radio:* nodemon server` to start up the backend on `http://localhost:3000/`.
Run `ng serve` to run the frontend dev server.  This will proxy backend requests to the backend.

Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Production

```
npm run build
npm run start
```

To run at startup via crontab:
```
@reboot cd ~/cc-radio ; /usr/bin/forever start -c /usr/bin/node server.js
```

## Notes

### Station configuration
Station configuration is via `config/default.json`.  

Useful links for extending this:
* A radio player ID from http://www.radioplayer.co.uk.
* A stream URL (perhaps) from http://forums.linn.co.uk/bb/showthread.php?tid=29518&pid=348776#pid348776.

### Code state

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.6.3.

Adjusted according to https://medium.com/codingthesmartway-com-blog/building-an-angular-5-project-with-bootstrap-4-and-firebase-4504ff7717c1
