// Get dependencies
const express = require('express');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
const socketio = require('socket.io');
const debug = require('debug')('Radio:Server');

// Config
require('dotenv').config();
const config = require('config');

if (!process.env.CC_NAME) {
  console.error("CC_NAME env variable undefined, see README config section");
  process.exit(128);
}

if (!process.env.WEBAPP_TITLE) {
  console.error("CC_NAME env variable undefined, see README config section");
  process.exit(128);
}

// Basic server initiation
const app = express();

// Parsers for POST data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

// Point static path to dist
app.use(express.static(path.join(__dirname, 'dist')));

// And some static images
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Runtime config to client
app.get('/config.json', (request, response) => {
  response.json({ pageTitle: process.env.WEBAPP_TITLE });
});

// Get the stations
const stations = config.stations;

/**
 * Get port from environment and store in Express.
 */
const port = process.env.PORT || '3000';
app.set('port', port);

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

/**
 * Control the Chromecast
 */
let currentState = {};
const CastController = require('./server/CastController');
const cast = new CastController(process.env.CC_NAME);
cast.on('state', state => currentState = state);

/**
 * On-air monitoring
 */
const InfoController_BBC = require('./server/InfoController_BBC');
const bbc_onair = new InfoController_BBC(stations);
bbc_onair.monitorOccasional(stations);

/**
 * Attach WebSockets
 */
// Create a Socket.IO instance, passing it our server
var socket = socketio(server);

// Add a connect listener
socket.on('connection', function(client) {

  debug('Web client has connected');

  // Reset the occasional monitor - get the latest information now
  bbc_onair.monitorOccasional(stations);

  // Send station information *first*
  client.emit('stations', stations);

  client.emit('programme-info', stations);
  
  // Update the schedule info
  bbc_onair.updateProgrammes(stations);

  // Send whatever we have state-wise
  client.emit('state', currentState);

  // Success!  Now listen to messages to be received
  client.on('message', function(event) {
    debug('Received message from web client!', event);
  });

  client.on('disconnect', function() {
    debug('Web client has disconnected');
  });

  client.on('action-play', station => {
    debug('action-play', station);
    cast.play(station);

    // We're playing a different station now - immediately start monitoring  it in detail
    bbc_onair.monitorFrequent([station]);
  });

  client.on('action-pause', args => {
    debug('action-pause');
    cast.pause();

    // We're not playing any stations - stop frequently polling
    bbc_onair.monitorFrequent([]);
  });

});

// Whenever programme or track information changes, clients want to know
bbc_onair.on('programme-info', data => {
  debug(`received programme info`, data);
  if (!data.station) {
    return;
  }
  socket.emit('programme-info', data);
});
bbc_onair.on('track-info', data => {
  debug(`received track info`, data);
  // Find the associated station
  if (!data.station) {
    return;
  }
  socket.emit('track-info', data);
});

// Whenever our state changes, clients want to know
cast.on('state', state => socket.emit('state', state));

// New state
cast.on('state', state => {
  // If we're *playing* a station, then monitor it more frequently
  const activeStation = state.application == 'Default Media Receiver' && stations.find(station => station.name === (state && state.media && state.media.title));
  if (activeStation && state.play === 'play') {
    bbc_onair.monitorFrequent([activeStation]);
  }
});

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port, () => debug(`API running on localhost:${port}`));
