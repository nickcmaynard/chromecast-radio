'use strict';

const EventEmitter = require('events').EventEmitter;

const debug = require('debug')('Radio:OnAirController');

const jsonpClient = require('jsonp-client');
const bent = require('bent');

const _ = require('lodash');

function addCallback(url) {
    // The URL already has a callback
    if (url.match(/callback=[a-z]/i)) {
        return url;
    }
    return url + ("&callback=cb" + Math.random()).replace('.', '');
}

class OnAirController extends EventEmitter {

  constructor() {
    super();
  }

  /**
   * Occasional monitoring of stations
   */
  monitorOccasional(stations) {
    return this.monitor(stations, 120000, 'occasionalInterval');
  }

  /**
   * More frequest monitoring of stations
   */
  monitorFrequent(stations) {
    return this.monitor(stations, 15000, 'frequentInterval');
  }

  monitor(stations, frequencyMs, intervalVarName) {
    // Stop monitoring any previous stations
    this[intervalVarName] && clearInterval(this[intervalVarName]);

    // Start monitoring new stations
    this[intervalVarName] = setInterval(() => this.poll(stations), frequencyMs);

    // Initial poll - we don't want to have to wait
    this.poll(stations);
  }

  poll(stations) {
    const bbcStations = stations.filter(station => !!station.bbcMeta);
    
    debug(`polling ${bbcStations.length} BBC stations' track info`);
    
    // Get track info
    stations.forEach(station => {
      
      bent('json')(`https://rms.api.bbc.co.uk/v2/services/${station.bbcMeta.rmsId}/segments/latest`).then(response => {
        debug('got track information', JSON.stringify(response, null, 2));
        if (_.get(response, 'data[0].offset.now_playing')) {
          debug(`track is playing on rpId ${station.bbcMeta.rpId}`);
          this.emit('track-info', { station, track: {
            artistName: response.data[0].titles.primary,
            name: response.data[0].titles.secondary
          }});
        } else {
          debug(`track is NOT playing on rpId  ${station.bbcMeta.rpId}`);
          this.emit('track-info', { station, track: undefined });
        }
      });
      // 
      // bent('json')(`https://ess.api.bbci.co.uk/schedules?serviceId=${id}`).then(response => {
      //   debug('got programme information', JSON.stringify(response, null, 2));
      //   const now = new Date().toISOString();
      //   const programme = response.items.find(i => i.published_time.start <= now && i.published_time.end > now);
      //   programme && this.emit('programme-info', { rpId: id, programme: {
      //     name: `${programme.brand.title} : ${programme.episode.title}`
      //   }});
      // });
      
    });
    
    // Get programme info
    const rpIds = bbcStations.map(station => station.bbcMeta.rpId);
    const url = this.generatePollUrl(rpIds);
    debug(`polling programme info for rpIds ${rpIds}`);
    
    jsonpClient(addCallback(url), (error, data) => {
      if (error) {
        console.error(error);
        return;
      }
      if (data.responseStatus !== "SUCCESS") {
        console.error(data);
        return;
      }
      debug('got programme information', JSON.stringify(data, null, 2));
      rpIds.forEach(rpId => {
        const programme = data.results[rpId].find(i => i.type === 'PI');
        
        const station = bbcStations.find(station => station.bbcMeta.rpId === rpId);
        programme && this.emit('programme-info', { station, programme });
      });
    
    });
  }

  generatePollUrl(rpIds) {
    debug(`generating programme info poll URL for ${rpIds}`);
    // TODO: New services' swagger: https://rms.api.bbc.co.uk/docs/swagger.json
    return `https://np.radioplayer.co.uk/qp/v3/onair?rpIds=${rpIds.join(",")}&nameSize=200&artistNameSize=200&descriptionSize=200`
  }

};


module.exports = OnAirController;
