import { Injectable } from '@angular/core';
import { Socket } from 'ng-socket-io';
import { Observable } from 'rxjs';
import { debounce } from 'rxjs/operators';

const actionQuietPeriod = 5000;
const defaultDebounce = 1000;

@Injectable()
export class CommService {

  static _stateDebounceTime: integer = defaultDebounce;
  static _stateDebounceTimer: Object;
  
  constructor(private socket: Socket) { }

  sendMessage(msg: string) {
    this.socket.emit('message', msg);
  }

  getStations() {
    return this.socket
      .fromEvent('stations');
  }

  getState() {
    return this.socket
      .fromEvent('state').pipe(debounce(() => Observable.timer(CommService._stateDebounceTime)));
  }

  getProgrammeInfo() {
    return this.socket
      .fromEvent('programme-info');
  }

  getTrackInfo() {
    return this.socket
      .fromEvent('track-info');
  }
  
  isInQuietPeriod() {
    return CommService._stateDebounceTime !== 0;
  }

  action(type, args) {
    // Setting an action.  Debounce state updates for a bit
    CommService._stateDebounceTime = actionQuietPeriod;
    clearTimeout(CommService._stateDebounceTimer);
    CommService._stateDebounceTimer = setTimeout(() => { CommService._stateDebounceTime = defaultDebounce }, actionQuietPeriod);
    
    return this.socket.emit(`action-${type}`, args);
  }
}
