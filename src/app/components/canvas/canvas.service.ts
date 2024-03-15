import { Injectable } from '@angular/core';
import { Vector2d } from 'konva/lib/types';
import { BehaviorSubject, distinctUntilChanged, shareReplay } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CanvasService {

  private mouseoverCutID: BehaviorSubject<string> = new BehaviorSubject('');
  public mouseoverCutID$ = this.mouseoverCutID.pipe(distinctUntilChanged(), shareReplay());

  private mouseoverCoords = new BehaviorSubject<Vector2d | null>(null);
  public mouseoverCoords$ = this.mouseoverCoords.pipe(distinctUntilChanged(), shareReplay());

  constructor() {
  }

  public updateMouseoverCutID(id: string) {
    this.mouseoverCutID.next(id);
  }

  public updateMouseoverCoords(coords: Vector2d | null) {
    this.mouseoverCoords.next(coords);
    //console.log('updateMouseoverCoords', coords);
  }

  public getMouseoverCoords() {
    return this.mouseoverCoords.value;
  }
}
