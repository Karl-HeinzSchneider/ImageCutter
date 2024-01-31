import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayerBoxComponent } from '../layer-box/layer-box.component';
import { AppRepository, ImageProps } from '../../state/cutter.store';
import { TooltipModule } from '../../modules/tooltip/tooltip.module';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-layers-export',
  standalone: true,
  imports: [CommonModule, LayerBoxComponent, TooltipModule],
  templateUrl: './layers-export.component.html',
  styleUrl: './layers-export.component.scss'
})
export class LayersExportComponent {

  public active$: Observable<ImageProps | undefined>;

  constructor(private store: AppRepository) {
    this.active$ = store.active$;
  }

  onClickSelected(active: ImageProps) {
    console.log('onClickSelected')
  }

  onClickAll(active: ImageProps) {
    console.log('onClickAll')
  }
}
