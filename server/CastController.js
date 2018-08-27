'use strict';

/*
Accept the following commands:
  play(radioStation)
  pause()

I care about the following events:
  applicationChange
  media
  playState
  powerState

*/
const EventEmitter = require('events').EventEmitter;
const Q = require('q');
const Promise = Q.Promise;
const Client                = require('castv2-client').Client;
const DefaultMediaReceiver  = require('castv2-client').DefaultMediaReceiver;
const mdns                  = require('mdns-js');
const debounce              = require('debounce');

const debug = require('debug')('Radio:CastController');

class CastController extends EventEmitter {

  constructor(target) {
    super();

    this.target = target;
    this.state = {};

    this.clientDeferred = Q.defer();

    // Events
    const DeviceMonitor = require('castv2-device-monitor').DeviceMonitor;

    // Monitor the chromecast's macro state
    this.dm = new DeviceMonitor(target);
    const stateFields = ['power', 'application', 'media', 'play'];
    const emitState = debounce(() => {
      debug('emitState', this.state);
      this.emit('state', this.state);
    }, 500);
    const update = (name, state) => {
      if (this.state[name] !== state) {
        stateFields.slice(stateFields.indexOf(name)).forEach(field => delete state[field]);
      }
      this.state[name] = state;
      this.emit(name + '-state', state);
      emitState();
    };
    this.dm.on('powerState', state => update('power', state) );
    this.dm.on('playState', state => update('play', state) );
    this.dm.on('application', state => update('application', state) );
    this.dm.on('media', state => update('media', state) );

    // Maintain a connection for our own purposes
    let browser = mdns.createBrowser(mdns.tcp('googlecast'));
    browser.on('ready', function() {
      debug('browser ready');
      browser.discover()
    });

    // Listen to all chromecasts coming online
    browser.on('update', service => {
      debug('browser update');

      // Deserialise the x=y service.txt into a map - fallback {}
      const txtRecord = service.txt ? service.txt.reduce((acc, cur, i) => {
        const arr = cur.match('^(.*?)=(.*)$');
        arr && (acc[arr[1]] = arr[2]);
        return acc;
      }, {}) : {};
      debug('found device "%s" (%s) at %s:%d', txtRecord.fn, service.type[0].name, service.addresses[0], service.port);

      if (service.type[0].name === 'googlecast' &&
          txtRecord.fn === this.target) {
        // It's the chromecast device we care about...
        const clientIp = service.addresses[0];
        if (!this.client || clientIp !== this.clientIp) {
          // If we've lost the connection completely (thus client is missing), or the IP has changed
          this.clientIp = clientIp;
          if (this.client) {
              debug('Destroying clientConnection to replace with new');
              this.client.close();
              delete this.client;
              this.clientDeferred = Q.defer();
          }
          this.client = new Client();
          this.client.connect(this.clientIp, () => {
            debug('client connected');
            this.clientDeferred.resolve();
          });
          this.client.on('error', err => {
            debug('Error: %s', err.message);
            this.client.close();
            delete this.client;
            this.clientDeferred = Q.defer();
          });

        }
      }
    });

  }

  pause() {
    debug('pause');
    this.dm.pauseDevice();
  }

  play(station) {
    debug('play', station);
    if (this.state.play === 'pause' && this.state.media.artist === station.group && this.state.media.title === station.name) {
      debug('device is paused on correct station, resuming');
      this.dm.playDevice();
    } else {
      debug('starting new media receiver for new station');
      // Wait until we have a connection!
      this.clientDeferred.promise.then(() => {
        const playerDebug = require('debug')(`Radio:CastController:player:${Math.floor(Math.random() * 1000)}`);
        this.client.launch(DefaultMediaReceiver, (err, player) => {
          playerDebug('launching receiver');
          this.player = player;

          var media = {

          	// Here you can plug an URL to any mp4, webm, mp3 or jpg file with the proper contentType.
            // contentId: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/big_buck_bunny_1080p.mp4',
            // contentType: 'video/mp4',
            // streamType: 'BUFFERED', // or LIVE
            contentId: station.content,
            contentType: station.contentType,
            streamType: station.streamType || 'LIVE',

            // Title and cover displayed while buffering
            metadata: {
              type: 0,
              metadataType: 0,
              artist: station.group,
              title: station.name,
              images: [
                { url: station.image }
              ]
            }
          };

          player.on('status', function(status) {
            playerDebug('status broadcast playerState=%s', status.playerState);
          });

          playerDebug('app "%s" launched, loading media %s ...', player.session.displayName, media.contentId);

          player.load(media, { autoplay: true }, function(err, status) {
            playerDebug('media loaded playerState=%s', status && status.playerState);
          });

        });
      });
    }
  }

};


module.exports = CastController;
