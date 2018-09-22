import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-now-playing-pane',
  templateUrl: './now-playing-pane.component.html',
  styleUrls: ['./now-playing-pane.component.scss']
})
export class NowPlayingPaneComponent implements OnInit {

  @Input() state: any;
  @Input() playing: boolean;

  constructor() { }

  ngOnInit() {
  }

}
