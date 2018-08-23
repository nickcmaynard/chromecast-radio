import { Component, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { CommService } from './comm.service';

import {
  SwiperComponent, SwiperDirective, SwiperConfigInterface,
  SwiperScrollbarInterface, SwiperPaginationInterface
} from 'ngx-swiper-wrapper';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [CommService]
})
export class AppComponent implements OnInit, AfterViewInit {

  @ViewChild('mainSwiper') mainSwiperRef: SwiperComponent;

  title: string;

  state: any;
  stations: any;
  programmes: any;
  tracks: any;

  public mainConfig: SwiperConfigInterface = {
    direction: 'horizontal',
    slidesPerView: 1,
    spaceBetween: 10,
    centeredSlides: true,
    pagination: true
  };

  constructor(private commService: CommService) {
    this.title = 'Beans\' Radio';
    this.programmes = {};
    this.tracks = {};
  }

  ngOnInit() {
    this.commService.getState().subscribe(this.onNewState.bind(this));
    this.commService.getStations().subscribe(stations => this.stations = stations);
    this.commService.getProgrammeInfo().subscribe((info: any) => this.programmes[info.station.rpId] = info.programme);
    this.commService.getTrackInfo().subscribe((info: any) => this.tracks[info.station.rpId] = info.track);
  }

  onNewState(state) {
    this.state = state;

    const pane = this.getActivePaneIndex();
    if (pane !== -1) {
      this.showPane(pane);
    } else {
      this.showPane(this.stations.findIndex(s => s.preferred));
    }
  }

  getActivePaneIndex() {
    const activeStationIndex = this.getActiveStationIndex();
    if (activeStationIndex !== -1) {
      return activeStationIndex;
    } else if (this.isPlayingAlbum()) {
      // highlight final pane if album playing
      return this.stations.length;
    } else {
      // highlight preferred pane
      return this.stations.findIndex(s => s.preferred);
    }
  }

  getActiveStation() {
    const index = this.getActiveStationIndex();
    return (this.stations && index !== -1) ? this.stations[index] : undefined;
  }

  getActiveStationIndex() {
    if (this.state && this.state.application === 'Default Media Receiver' && this.stations) {
      return this.stations.findIndex(station => station.name === (this.state && this.state.media && this.state.media.title));
    } else {
      return -1;
    }
  }

  getProgrammeTitle(programme) {
    const colonIdx = programme.name.indexOf(' : ');
    if (colonIdx !== -1) {
      return `<h2>${programme.name.substring(0, colonIdx)}</h2><h3>${programme.name.substring(colonIdx + 3)}</h3>`;
    } else {
      return `<h2>${programme.name}</h2>`;
    }
  }

  getImageUrl(url) {
    // Enhance ichef urls
    const re = new RegExp('^https?:\/\/ichef\.bbci\.co\.uk\/images\/ic\/(\\d+x\\d+)\/(.+)$');
    const matches = re.exec(url);
    if (matches) {
      return `http://ichef.bbci.co.uk/images/ic/736x414/${matches[2]}`;
    }
    return url;
  }

  isActive(station) {
    const activeStation = this.getActiveStation();
    return activeStation && activeStation.name === station.name;
  }

  isPlayingStation(station) {
    return this.isActive(station) && this.state.play === 'play' && this.state.power === 'on';
  }

  isPlayingAlbum() {
    return this.state && this.state.play === 'play' && this.state.power === 'on' && this.state.media && (this.state.media.albumName || this.state.media.albumArtist);
  }

  showPane(index) {
    this.mainSwiperRef.directiveRef.setIndex(index);
  }

  play(station) {
    this.commService.action('play', station);
  }

  pause() {
    this.commService.action('pause', null);
  }

  ngAfterViewInit() {
    let slideReset;
    this.mainSwiperRef.directiveRef.swiper().on('slideChange', () => {
      if (slideReset) {
        clearTimeout(slideReset);
      }
      slideReset = setTimeout(() => {
        this.showPane(this.getActivePaneIndex());
      }, 10000);
    });
  }

}
