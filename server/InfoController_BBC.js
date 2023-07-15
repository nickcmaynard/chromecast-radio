'use strict';

const EventEmitter = require('events').EventEmitter;

const debug = require('debug')('Radio:InfoController_BBC');

const jsonpClient = require('jsonp-client');
const bent = require('bent');

const axios = require('axios');

const htmlparser2 = require("htmlparser2");
const domutils = require('domutils'); 

const _ = require('lodash');

class InfoController_BBC extends EventEmitter {

  constructor() {
    super();
    
    this.yesterdayScheds = {};
    this.schedules = {};
  }

  /**
   * More frequest monitoring of stations - usually when it's playing!
   */
  monitorFrequent(stations) {
    // Track monitoring
    return this._monitor(stations, 15000, 'frequentInterval');
  }
  
  /**
   * More frequest monitoring of stations - usually when it's playing!
   */
  monitorOccasional(stations) {
    // Track monitoring
    return this._monitor(stations, 120000, 'occasionalInterval');
  }
  
  updateProgrammes(stations) {
    this._pollProgrammes(stations);
  }

  _monitor(stations, frequencyMs, intervalVarName) {
    const bbcStations = stations.filter(station => !!station.bbcMeta);
    
    if (!this.scheduleInterval) {
      // Get schedule information every 30 minutes
      this.scheduleInterval = setInterval(() => this._getSchedules(bbcStations), 30*60*1000);
      // Initial poll - we don't want to have to wait
      this._getSchedules(stations);
    }
    
    // Stop monitoring any previous stations
    this[intervalVarName] && clearInterval(this[intervalVarName]);
    // Start monitoring new stations
    this[intervalVarName] = setInterval(() => {
      this._pollTracks(bbcStations);
      this._pollProgrammes(bbcStations);
    }, frequencyMs);
    // Initial poll - we don't want to have to wait
    this._pollTracks(bbcStations);
    this._pollProgrammes(bbcStations);
  }

  _getSchedules(stations) {
    debug(`get ${stations.length} BBC stations' schedule info`);
    
    // Get track info
    stations.forEach(station => {
      
      // https://rms.api.bbc.co.uk/v2/broadcasts/schedules/bbc_radio_fourfm/2020-04-16
      const dateString = new Date().toISOString().substring(0,10);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate()-1);
      const yesterdayString = yesterday.toISOString().substring(0,10);
      
      // Get today's schedule
      const pToday = axios({
        method: 'get',
        url: `https://rms.api.bbc.co.uk/v2/broadcasts/schedules/${station.bbcMeta.rmsId}/${dateString}`,
        responseType: 'json'
      }).then(response => response.data.data, err => {
        debug('couldn\'t get programme information', err);
        return [];
      });

      // Get yesterday's schedule (handle the midnight rollover issue)
      const pYesterday = axios({
        method: 'get',
        url: `https://rms.api.bbc.co.uk/v2/broadcasts/schedules/${station.bbcMeta.rmsId}/${dateString}`,
        responseType: 'json'
      }).then(response => response.data.data, err => {
        debug('couldn\'t get yesterday\'s programme information', err);
        return [];
      });

      Promise.all([pToday, pYesterday]).then(infoArr => {
        this.schedules[station.bbcMeta.rmsId] = infoArr.flat();
        this._pollProgrammes([station]);
      });
      
    });
  }
  
  _pollProgrammes(stations) {
    const now = new Date().toISOString();
    stations.forEach(station => {
      // Stop if we don't have schedule information for this station
      if (!this.schedules[station.bbcMeta.rmsId]) return;
      // debug(this.schedules[station.bbcMeta.rmsId], now);
      const summary = this.schedules[station.bbcMeta.rmsId].find(i => i.start <= now && i.end > now && i.service_id === station.bbcMeta.rmsId);
      
      // debug('got programme information', JSON.stringify(summary, null, 2));
      summary && this.emit('programme-info', { station, programme: {
        name: `${_.get(summary,'titles.primary')} : ${_.get(summary,'titles.secondary')}`,
        description: _.get(summary,'synopses.medium'),
        imageUrl: _.get(summary,'image_url')
      }});
    })
  }

  _pollTracks(stations) {
    debug(`polling ${stations.length} BBC stations' track info`);
    
    // Get track info
    stations.forEach(station => {
      axios({
        method: 'get',
        url: `https://rms.api.bbc.co.uk/v2/services/${station.bbcMeta.rmsId}/segments/latest`,
        responseType: 'json'
      }).then(aResponse => {
        const response = aResponse.data;
        // debug('got track information', JSON.stringify(response, null, 2));
        if (_.get(response, 'data[0].offset.now_playing')) {
          debug(`track is playing on rmsId ${station.bbcMeta.rmsId}`);
          this.emit('track-info', { station, track: {
            artistName: response.data[0].titles.primary,
            name: response.data[0].titles.secondary
          }});
        } else {
          debug(`track is NOT playing on rmsId ${station.bbcMeta.rmsId}`);
          this.emit('track-info', { station, track: undefined });
        }
      }, err => {
        debug('couldn\'t get track information', err);
      });
    });
  }

};


module.exports = InfoController_BBC;
