import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayerBoxComponent } from '../layer-box/layer-box.component';
import { CanvasNavigationComponent } from '../canvas-navigation/canvas-navigation.component';
import { LayersCutsComponent } from '../layers-cuts/layers-cuts.component';
import { AppRepository, ImageProps } from '../../state/cutter.store';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-layers',
  standalone: true,
  imports: [CommonModule, LayerBoxComponent, CanvasNavigationComponent, LayersCutsComponent],
  templateUrl: './layers.component.html',
  styleUrl: './layers.component.scss'
})
export class LayersComponent {
  active$: Observable<ImageProps | undefined>;

  constructor(private store: AppRepository) {
    this.active$ = store.active$
  }

}
