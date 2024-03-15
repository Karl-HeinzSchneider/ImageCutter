import { Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, shareReplay } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CanvasService {

  private mouseoverCutID: BehaviorSubject<string> = new BehaviorSubject('');
  public mouseoverCutID$ = this.mouseoverCutID.pipe(distinctUntilChanged(), shareReplay());

  constructor() {
  }

  public updateMouseoverCutID(id: string) {
    this.mouseoverCutID.next(id);
  }
}
