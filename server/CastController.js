'use strict';

/*
Accept the following commands:
  play(radioStation)

I care about the following events:
  applicationChange
  media
  playState
  powerState

*/

const EventEmitter = require('events').EventEmitter;
const Q = require('Q');
const Promise = Q.Promise;
const Client                = require('castv2-client').Client;
const DefaultMediaReceiver  = require('castv2-client').DefaultMediaReceiver;
const mdns                  = require('mdns');

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
    let dm = new DeviceMonitor(target);
    const update = (name, state) => {
      this.state[name] = state;
      this.emit(name + '-state', state);
      this.emit('state', this.state);
      debug(this.state);
    };
    dm.on('powerState', state => update('power', state) );
    dm.on('playState', state => update('play', state) );
    dm.on('application', state => update('application', state) );
    dm.on('media', state => update('media', state) );

    // Maintain a connection for our own purposes
    let browser = mdns.createBrowser(mdns.tcp('googlecast'));

    // Listen to all chromecasts coming online
    browser.on('serviceUp', service => {
      debug('found device "%s" at %s:%d', service.name, service.addresses[0], service.port);
      if (service.type.name === 'googlecast' &&
          service.txtRecord &&
          service.txtRecord.fn &&
          service.txtRecord.fn === this.target) {

        // It's the chromecast device we care about...
        const clientIp = service.addresses[0];
        if (!this.client || clientIp !== this.clientIp) {
          // If we've lost the connection completely (thus client is missing), or the IP has changed
          this.clientIp = clientIp;
          if (this.client) {
              debug('Destroying clientConnection to replace with new')
              this.client.close();
              delete this.client;
              this.clientDeferred = Q.defer();
          }
          this.client = new Client();
          this.client.connect(this.clientIp, () => {
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
    browser.start();

  }

  play(station) {
    // Wait until we have a connection!
    this.clientDeferred.promise.then(() => {
      this.client.launch(DefaultMediaReceiver, function(err, player) {
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
          debug('status broadcast playerState=%s', status.playerState);
        });

        debug('app "%s" launched, loading media %s ...', player.session.displayName, media.contentId);

        player.load(media, { autoplay: true }, function(err, status) {
          debug('media loaded playerState=%s', status.playerState);
        });

      });
    })
  }

};


module.exports = CastController;
