// Get dependencies
const express = require('express');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
const io = require('socket.io');
const debug = require('debug')('Radio:Server');
const jsonpClient = require('jsonp-client');
function addCallback(url) {
    // The URL already has a callback
    if (url.match(/callback=[a-z]/i)) {
        return url;
    }
    return url + ("&callback=cb" + Math.random()).replace('.', '');
}

// Get the stations
const stations = require('./server/stations.json');

// Get our API routes
const api = require('./server/routes/api');

const app = express();

// Parsers for POST data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Point static path to dist
app.use(express.static(path.join(__dirname, 'dist')));

// And some static images
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Set our api routes
app.use('/api', api);

// Catch all other routes and return the index file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

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
const cast = new CastController('Beans\' Chromecast');
cast.on('state', state => currentState = state);

const getActiveStation = state => {
  return state.application == 'Default Media Receiver' && stations.find(station => station.name === (state && state.media && state.media.title));
}

// On air checks
// TODO: Refactor this so it's intelligible
let onairCheckInterval;
const pollOnAir = (url, forceEmit) => {
  debug("polling onair", url);
  jsonpClient(addCallback(url), (error, data) => {
    if (error) {
      console.error(error);
      return;
    }
    const info = Object.values(data.results)[0];
    // Programme info
    const programme = info.find(i => i.type === 'PI');
    (programme || forceEmit) && socket.emit('programme-info', { programme: programme });
    // Track info
    const track = info.find(i => i.type === 'PE_E');
    (track || forceEmit) && socket.emit('track-info', { track: track });
  });
}
const onAirCheck = state => {
  debug("onAirCheck");
  // Cancel any existing station onair polling
  onairCheckInterval && clearInterval(onairCheckInterval);

  const activeStation = getActiveStation(state) && (state.play === 'play');
  if (activeStation) {
    const check = (forceEmit) => {
      // Run the check
      if (!activeStation.nowPlaying) {
        return;
      }
      pollOnAir(activeStation.nowPlaying, forceEmit);
    };
    onairCheckInterval = setInterval(check, 10000);
    check(true);
  }
};

/**
 * Attach WebSockets
 */
// Create a Socket.IO instance, passing it our server
var socket = io.listen(server);

// Add a connect listener
socket.on('connection', function(client){

  debug('Web client has connected');
  onAirCheck(currentState);

  // Send whatever we have state-wise
  client.emit('state', currentState);
  client.emit('stations', stations);

	// Success!  Now listen to messages to be received
	client.on('message',function(event){
		debug('Received message from web client!',event);
	});

	client.on('disconnect',function(){
		debug('Web client has disconnected');
	});

  client.on('action-play', station => {
    debug('action-play', station);
    cast.play(station);

    // TODO: don't futz
    // futz with the onair checking
    onairCheckInterval && clearInterval(onairCheckInterval);
    pollOnAir(station.nowPlaying);
  });

});

// Whenever our state changes, clients want to know
cast.on('state', state => socket.emit('state', state));
// New state, so reinit the on air checks
cast.on('state', state => onAirCheck(state));

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port, () => debug(`API running on localhost:${port}`));
