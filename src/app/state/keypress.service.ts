import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class KeypressService {

  private pressedKeys = new Set<string>;

  constructor() {
    console.log('KeypressService init');
    this.setupEvents();
  }

  private setupEvents() {
    window.addEventListener('keydown', (e) => {
      if (!e.repeat) {
        this.pressedKeys.add(e.key);
        //console.log('keyDown', e, this.pressedKeys);
      }
    })

    window.addEventListener('keyup', (e) => {
      this.pressedKeys.delete(e.key)
      //console.log('keyUp', e, this.pressedKeys);
    })
  }

  public isKeyPressed(key: string): boolean {
    return this.pressedKeys.has(key)
  }
}
