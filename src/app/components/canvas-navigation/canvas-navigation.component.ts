import { Component, OnDestroy, OnInit, Pipe, PipeTransform } from '@angular/core';
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

}
