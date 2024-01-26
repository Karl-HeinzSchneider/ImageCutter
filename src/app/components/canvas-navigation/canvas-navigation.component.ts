import { Component, ElementRef, OnDestroy, OnInit, Pipe, PipeTransform, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppRepository, ImageProps } from '../../state/cutter.store';
import { Observable, Subject, debounceTime, takeUntil } from 'rxjs';

// fn: https://www.wolframalpha.com/input?i=exp+fit+%7B%7B0%2C0.1%7D%2C%7B30%2C1%7D%2C%7B100%2C50%7D%7D
// inverse: https://www.wolframalpha.com/input?i=Umkehrfunktion+f%28x%29%3D0.18129+e%5E%280.0561968+x%29
@Pipe({ name: 'inverseExp', standalone: true })
export class inverseExpPipe implements PipeTransform {

  transform(val: number) {
    return 17.7946 * Math.log(5.516024049864857 * val)
  }
}

@Component({
  selector: 'app-canvas-navigation',
  standalone: true,
  imports: [CommonModule, inverseExpPipe],
  templateUrl: './canvas-navigation.component.html',
  styleUrl: './canvas-navigation.component.scss'
})
export class CanvasNavigationComponent implements OnDestroy, OnInit {
  @ViewChild('zoomSlider', { static: false }) zoomSliderRef!: ElementRef;

  active$: Observable<ImageProps | undefined>;

  private readonly destroy$ = new Subject<number>()
  private updateSubject = new Subject<[string, number]>;

  constructor(private store: AppRepository) {
    this.active$ = this.store.active$
  }

  ngOnInit(): void {
    this.updateSubject.pipe(
      debounceTime(5),
      takeUntil(this.destroy$)
    ).subscribe(value => {
      this.store.updateZoom(value[0], value[1])
    })
  }

  ngOnDestroy(): void {
    this.destroy$.next(1)
    this.destroy$.complete()
  }

  onSliderChange(e: Event, id: string) {
    //console.log(e)
    const tar = e.target as HTMLInputElement

    const value = this.scaleValue(Number(tar.value))
    //console.log(tar.value)
    //this.store.updateZoom(id, value)
    this.updateSubject.next([id, value])
  }

  scaleValue(val: number): number {
    return 0.18129 * Math.exp(0.0561968 * val)
  }

  public zoomInClicked(id: string) {
    const slider = this.zoomSliderRef.nativeElement as HTMLInputElement
    const oldValue = Number(slider.value)
    const changedValue = Math.round(oldValue) + 2

    const newValue = Math.min(changedValue, Number(slider.max))


    const scaledValue = this.scaleValue(newValue)
    this.updateSubject.next([id, scaledValue])

    //console.log('zoomIn', oldValue, newValue, id, scaledValue)
  }

  public zoomOutClicked(id: string) {
    const slider = this.zoomSliderRef.nativeElement as HTMLInputElement
    const oldValue = Number(slider.value)
    const changedValue = Math.round(oldValue) - 2

    const newValue = Math.max(changedValue, Number(slider.min))


    const scaledValue = this.scaleValue(newValue)
    this.updateSubject.next([id, scaledValue])

    // console.log('zoomOut', oldValue, newValue, id, scaledValue)
  }

  public maximizeClicked(active: ImageProps) {
    //console.log('maximize', active)

    if (!active.file) {
      return;
    }

    const wHeight = window.innerHeight
    const wWidth = window.innerWidth
    //console.log(wWidth, wHeight)

    // See: canvas.component - resizeStage()
    const padding = 24

    const rHeight = wHeight - 32 - 48 - 32 - 32 - 2 * padding
    const rWidth = wWidth - 48 - 240 - 2 * padding

    const hScale = rHeight / active.file.height;
    const wScale = rWidth / active.file.width

    const newScaleCalc = Math.min(hScale, wScale)

    const slider = this.zoomSliderRef.nativeElement as HTMLInputElement

    const newScale = Math.max(Number(slider.min), Math.min(Number(slider.max), newScaleCalc))
    this.updateSubject.next([active.id, newScale])

    // console.log('scale', hScale, wScale, newScale)
  }

  public zoomerClicked(active: ImageProps, zoomLevel: number) {
    this.updateSubject.next([active.id, zoomLevel])
  }
}
