// Get dependencies
const express = require('express');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
const io = require('socket.io');
const debug = require('debug')('Radio:Server');

// Config
require('dotenv').config();
const config = require('config');

if (!process.env.CC_NAME) {
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
const OnAirController = require('./server/OnAirController');
const onair = new OnAirController();
// Kick off occasional monitoring of all stations
onair.monitorOccasional(stations.map(station => station.rpId).filter(id => !!id));

/**
 * Attach WebSockets
 */
// Create a Socket.IO instance, passing it our server
var socket = io.listen(server);

// Add a connect listener
socket.on('connection', function(client) {

  debug('Web client has connected');

  // Reset the occasional monitor - get the latest information now
  onair.monitorOccasional(stations.map(station => station.rpId).filter(id => !!id));

  // Send whatever we have state-wise
  client.emit('state', currentState);
  client.emit('stations', stations);

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
    onair.monitorFrequent([station.rpId]);
  });

});

// Whenever programme or track information changes, clients want to know
onair.on('programme-info', data => {
  // Find the associated station
  const station = stations.find(station => data.rpId === station.rpId);
  if (!station) {
    return;
  }
  socket.emit('programme-info', {
    station: station,
    programme: data.programme
  });
});
onair.on('track-info', data => {
  // Find the associated station
  const station = stations.find(station => data.rpId === station.rpId);
  if (!station) {
    return;
  }
  socket.emit('track-info', {
    station: station,
    track: data.track
  });
});

// Whenever our state changes, clients want to know
cast.on('state', state => socket.emit('state', state));

// New state
cast.on('state', state => {
  // If we're *playing* a station, then monitor it more frequently
  const activeStation = state.application == 'Default Media Receiver' && stations.find(station => station.name === (state && state.media && state.media.title));
  if (activeStation && state.play === 'play') {
    onair.monitorFrequent([activeStation.rpId]);
  }
});

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port, () => debug(`API running on localhost:${port}`));
