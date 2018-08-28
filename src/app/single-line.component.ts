import { Component, ViewChild, OnChanges, Input } from '@angular/core';

@Component({
  selector: 'single-line',
  template: '<div #ele [innerHTML]="getWrappedText()"></div>',
  styleUrls: ['./single-line.component.scss']
})
export class SingleLineComponent implements OnChanges {

  @ViewChild('ele') ele;

  @Input() text: string;

  constructor() { }

  getWrappedText() {
    return `<div class="single-line">${this.text}</div>`;
  }

  // ngOnChanges(changes: SimpleChanges) {
    // console.log("moo!");
    // const x = this.ele.nativeElement.offsetWidth;
    // console.log(this.ele, x);
  // }

}
