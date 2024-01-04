import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppRepository, ImageProps } from '../../state/cutter.store';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-canvas-navigation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canvas-navigation.component.html',
  styleUrl: './canvas-navigation.component.scss'
})
export class CanvasNavigationComponent {

  active$: Observable<ImageProps | undefined>;

  constructor(private store: AppRepository) {
    this.active$ = this.store.active$
  }


  onSliderChange(e: Event, id: string) {
    //console.log(e)
    const tar = e.target as HTMLInputElement

    const value = Number(tar.value)
    //console.log(tar.value)
    this.store.updateZoom(id, value)
  }

}
