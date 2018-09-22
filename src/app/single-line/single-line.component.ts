import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-single-line',
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
