import { Component, ViewChild } from '@angular/core';
import { CommService } from './comm.service';

import {
  SwiperComponent, SwiperDirective, SwiperConfigInterface,
  SwiperScrollbarInterface, SwiperPaginationInterface
} from 'ngx-swiper-wrapper';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [CommService]
})
export class AppComponent {

  title: string

  state: any
  stations: any
  programme: any
  track: any

  public mainConfig: SwiperConfigInterface = {
    direction: 'horizontal',
    slidesPerView: 1,
    spaceBetween: 10,
    centeredSlides: true,
    pagination: true
  };

  constructor(private commService: CommService) {
    this.title = 'Beans\' Radio';
  }

  ngOnInit() {
    this.commService.getState().subscribe(state => this.state = state);
    this.commService.getStations().subscribe(stations => this.stations = stations);
    this.commService.getProgrammeInfo().subscribe(info => { this.programme = info && info.programme });
    this.commService.getTrackInfo().subscribe(info => this.track = info && info.track);
  }

  getActiveStation() {
    return this.state
        && this.state.application == 'Default Media Receiver'
        && this.stations
        && this.stations.find(station => station.name === (this.state && this.state.media && this.state.media.title));
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

  isPlaying(station) {
    return this.isActive(station) && this.state.play === 'play';
  }

  play(station) {
    this.commService.action('play', station);
  }

  @ViewChild("mainSwiper") mainSwiperRef: SwiperComponent;

}
