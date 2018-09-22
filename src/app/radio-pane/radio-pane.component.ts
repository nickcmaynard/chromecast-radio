import { Component, OnInit, Input } from '@angular/core';
import { CommService } from '../comm.service';

@Component({
  selector: 'app-radio-pane',
  templateUrl: './radio-pane.component.html',
  styleUrls: ['./radio-pane.component.scss'],
  providers: [CommService]
})
export class RadioPaneComponent implements OnInit {

  @Input() station: any;
  @Input() programme: any;
  @Input() track: any;
  @Input() playing: boolean;

  constructor(private commService: CommService) { }

  ngOnInit() {
  }

  getProgrammeTitle(p) {
    if (!p || !p.name) {
      return '';
    }
    const colonIdx = p.name.indexOf(' : ');
    if (colonIdx !== -1) {
      return p.name.substring(0, colonIdx);
    } else {
      return p.name;
    }
  }

  getProgrammeSubtitle(p) {
    if (!p || !p.name) {
      return '';
    }
    const colonIdx = p.name.indexOf(' : ');
    if (colonIdx !== -1) {
      return p.name.substring(colonIdx + 3);
    } else {
      return;
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

  play(station) {
    this.commService.action('play', station);
  }

  pause() {
    this.commService.action('pause', null);
  }

}
