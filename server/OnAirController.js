'use strict';

const EventEmitter = require('events').EventEmitter;

const debug = require('debug')('Radio:OnAirController');

const jsonpClient = require('jsonp-client');
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
  monitorOccasional(rpIds) {
    return this.monitor(rpIds, 120000, 'occasionalInterval');
  }

  /**
   * More frequest monitoring of stations
   */
  monitorFrequent(rpIds) {
    return this.monitor(rpIds, 15000, 'frequentInterval');
  }

  monitor(rpIds, frequencyMs, intervalVarName) {
    // Stop monitoring any previous stations
    this[intervalVarName] && clearInterval(this[intervalVarName]);

    // Start monitoring new stations
    this[intervalVarName] = setInterval(() => this.poll(rpIds), frequencyMs);

    // Initial poll - we don't want to have to wait
    this.poll(rpIds);
  }

  poll(rpIds) {
    const url = this.generatePollUrl(rpIds);
    debug('polling', rpIds);
    jsonpClient(addCallback(url), (error, data) => {
      if (error) {
        console.error(error);
        return;
      }
      if (data.responseStatus !== "SUCCESS") {
        console.error(data);
        return;
      }
      debug('got onair information', data);
      rpIds.forEach(id => {
        const stationInfo = data.results[`${id}`];
        const programme = stationInfo.find(i => i.type === 'PI');
        programme && this.emit('programme-info', { rpId: id, programme: programme });
        const track = stationInfo.find(i => i.type === 'PE_E');
        this.emit('track-info', { rpId: id, track: track });
      });

    });
  }

  generatePollUrl(rpIds) {
    return `https://np.radioplayer.co.uk/qp/v3/onair?rpIds=${rpIds.join(",")}&nameSize=200&artistNameSize=200&descriptionSize=200`
  }

};


module.exports = OnAirController;
