import { BrowserModule, DomSanitizer } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';

import { SwiperModule } from 'ngx-swiper-wrapper';
import { SWIPER_CONFIG } from 'ngx-swiper-wrapper';
import { SwiperConfigInterface } from 'ngx-swiper-wrapper';

const DEFAULT_SWIPER_CONFIG: SwiperConfigInterface = {
  direction: 'horizontal',
  slidesPerView: 'auto',
  keyboard: true
};

import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { SingleLineComponent } from './single-line/single-line.component';
import { RadioPaneComponent } from './radio-pane/radio-pane.component';
import { NowPlayingPaneComponent } from './now-playing-pane/now-playing-pane.component';
const config: SocketIoConfig = { url: '', options: { transports: ['websocket'] } };

@NgModule({
  declarations: [
    AppComponent,
    SingleLineComponent,
    RadioPaneComponent,
    NowPlayingPaneComponent
  ],
  imports: [
    BrowserModule,
    SocketIoModule.forRoot(config),
    SwiperModule,
    BrowserAnimationsModule,
    HttpClientModule,
    // material - last
    MatIconModule, MatButtonModule
  ],
  bootstrap: [AppComponent],
  providers: [
    {
      provide: SWIPER_CONFIG,
      useValue: DEFAULT_SWIPER_CONFIG
    }
  ]
})
export class AppModule {
  constructor(matIconRegistry: MatIconRegistry, domSanitizer: DomSanitizer) {
    // Register material icons
    matIconRegistry.addSvgIconSet(domSanitizer.bypassSecurityTrustResourceUrl('./assets/mdi.svg'));
  }
}
