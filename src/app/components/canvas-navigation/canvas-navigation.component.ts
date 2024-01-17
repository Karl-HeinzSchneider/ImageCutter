import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppRepository, ImageProps } from '../../state/cutter.store';
import { Observable, Subject, debounceTime, takeUntil } from 'rxjs';

@Component({
  selector: 'app-canvas-navigation',
  standalone: true,
  imports: [CommonModule],
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

    const value = Number(tar.value)
    //console.log(tar.value)
    //this.store.updateZoom(id, value)
    this.updateSubject.next([id, value])
  }

}
