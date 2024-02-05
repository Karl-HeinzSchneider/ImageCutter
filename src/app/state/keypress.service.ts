import { Injectable } from '@angular/core';
import { BehaviorSubject, shareReplay } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KeypressService {

  private pressedKeys = new Set<string>;

  private pressedKeysSubject: BehaviorSubject<Set<string>> = new BehaviorSubject(new Set<string>());
  public pressedKeys$ = this.pressedKeysSubject.pipe(shareReplay())

  private keyDownSubject: BehaviorSubject<string> = new BehaviorSubject('');
  public keyDown$ = this.keyDownSubject.pipe(shareReplay())

  private keyDownRepeatSubject: BehaviorSubject<string> = new BehaviorSubject('');
  public keyDownRepeat$ = this.keyDownRepeatSubject.pipe(shareReplay())

  private keyUpSubject: BehaviorSubject<string> = new BehaviorSubject('');
  public keyUp$ = this.keyUpSubject.pipe(shareReplay())

  constructor() {
    console.log('KeypressService init');
    this.setupEvents();
  }

  private setupEvents() {
    window.addEventListener('keydown', (e) => {
      const key = e.key;
      this.keyDownRepeatSubject.next(key)

      if (!e.repeat) {
        this.pressedKeys.add(key);
        //console.log('keyDown', e, this.pressedKeys);
        this.updateSubject()
        this.keyDownSubject.next(key)
      }
    })

    window.addEventListener('keyup', (e) => {
      this.pressedKeys.delete(e.key)
      //console.log('keyUp', e, this.pressedKeys);
      this.updateSubject()
      this.keyUpSubject.next(e.key)
    })
  }

  private updateSubject() {
    this.pressedKeysSubject.next(this.pressedKeys);
  }

  public isKeyPressed(key: string): boolean {
    return this.pressedKeys.has(key)
  }
}
