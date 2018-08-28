import { Component, ViewChild, Input } from '@angular/core';

@Component({
  selector: 'single-line',
  template: '<div #ele [innerHTML]="getWrappedText()"></div>',
  styleUrls: ['./single-line.component.scss']
})
export class SingleLineComponent {

  @Input() text: string;

  constructor() { }

  getWrappedText() {
    return `<div class="single-line">${this.text}</div>`;
  }

}
