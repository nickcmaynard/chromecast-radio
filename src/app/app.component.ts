import { Component, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { CommService } from './comm.service';
import { NowPlayingPaneComponent } from './now-playing-pane/now-playing-pane.component';
import { RadioPaneComponent } from './radio-pane/radio-pane.component';
import { SingleLineComponent } from './single-line/single-line.component';

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

  stateTimeout: any;

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
    this.showCorrectPane();
  }

  showCorrectPane() {
    // Reset the "debounce"
    if (this.stateTimeout) {
      clearTimeout(this.stateTimeout);
    }

    const pane = this.getActivePaneIndex();
    if (pane !== -1) {
      // Definitely something happening on a specific pane - show it
      this.stateTimeout = setTimeout(() => {
        this.showPane(pane);
      }, 50);
    } else {
      // Wait a second in case changes are still coming
      this.stateTimeout = setTimeout(() => {
        // Set to the preferred pane
        this.showPane(this.stations.findIndex(s => s.preferred));
      }, 5000);
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
      return -1;
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

  isActive(station) {
    const activeStation = this.getActiveStation();
    return activeStation && activeStation.name === station.name;
  }

  isPlayingStation(station) {
    return this.isActive(station) && this.state.play === 'play' && this.state.power === 'on';
  }

  isPlayingAlbum() {
    return this.state && this.state.play === 'play' && this.state.power === 'on'
        && this.state.media && (this.state.media.albumName || this.state.media.albumArtist);
  }

  showPane(index) {
    this.mainSwiperRef.directiveRef.setIndex(index);
  }

  ngAfterViewInit() {
    let slideReset;
    this.mainSwiperRef.directiveRef.swiper().on('slideChange', () => {
      if (slideReset) {
        clearTimeout(slideReset);
      }
      slideReset = setTimeout(() => {
        this.showCorrectPane();
      }, 10000);
    });
  }

}
