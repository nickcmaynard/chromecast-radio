import { Injectable } from '@angular/core';
import { Socket } from 'ng-socket-io';

@Injectable()
export class CommService {

  constructor(private socket: Socket) { }

  sendMessage(msg: string) {
    this.socket.emit("message", msg);
  }

  getStations() {
    return this.socket
      .fromEvent("stations");
  }

  getState() {
    return this.socket
      .fromEvent("state");
  }

  getProgrammeInfo() {
    return this.socket
      .fromEvent("programme-info");
  }

  getTrackInfo() {
    return this.socket
      .fromEvent("track-info");
  }

  action(type, args) {
    return this.socket.emit(`action-${type}`, args);
  }
}
