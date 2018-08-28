import { Component, Input } from '@angular/core';

@Component({
  selector: 'single-line',
  template: '<div class="single-line"><ng-content></ng-content></div>',
  styleUrls: ['./single-line.component.scss']
})
export class SingleLineComponent {

  constructor() { }

}
