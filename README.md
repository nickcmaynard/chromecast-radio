# Chromecast Radio

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.6.3.

Adjusted according to https://medium.com/codingthesmartway-com-blog/building-an-angular-5-project-with-bootstrap-4-and-firebase-4504ff7717c1

## Setup

Copy `.env.example` to `.env`, and edit for your environment.

```
npm install
npm install -g nodemon # Development only
```

## Development server

Run `DEBUG=Radio:* nodemon server` to start up the backend on `http://localhost:3000/`.
Run `ng serve` to run the frontend dev server.  This will proxy backend requests to the backend.

Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Production

```
npm run build
npm run start
```
