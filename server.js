// Get dependencies
const express = require('express');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
const io = require('socket.io');
const debug = require('debug')('Radio:Server');

// Get our API routes
const api = require('./server/routes/api');

const app = express();

// Parsers for POST data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Point static path to dist
app.use(express.static(path.join(__dirname, 'dist')));

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

// XXX: Immediately start playing!!!
cast.play();

/**
 * Attach WebSockets
 */
// Create a Socket.IO instance, passing it our server
var socket = io.listen(server);

// Add a connect listener
socket.on('connection', function(client){

  debug('Web client has connected');
  // Send whatever we have state-wise
  socket.send(currentState);

	// Success!  Now listen to messages to be received
	client.on('message',function(event){
		debug('Received message from web client!',event);
	});

	client.on('disconnect',function(){
		debug('Web client has disconnected');
	});

});

// Whenever our state changes, clients want to know
cast.on('state', state => socket.send(state));

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port, () => debug(`API running on localhost:${port}`));
