import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayerBoxComponent } from '../layer-box/layer-box.component';
import { LayersCutComponent } from '../layers-cut/layers-cut.component';
import { AppRepository, CanvasProps, ImageProps } from '../../../state/cutter.store';
import { Observable, distinctUntilChanged, from, map, switchMap, tap } from 'rxjs';
import { TooltipModule } from '../../../modules/tooltip/tooltip.module';

@Component({
  selector: 'app-layers-cuts',
  standalone: true,
  imports: [CommonModule, LayerBoxComponent, LayersCutComponent, TooltipModule],
  templateUrl: './layers-cuts.component.html',
  styleUrl: './layers-cuts.component.scss'
})
export class LayersCutsComponent {

  active: ImageProps | undefined;

  active$: Observable<ImageProps | undefined>;
  activeCanvas$: Observable<CanvasProps>;

  constructor(private store: AppRepository) {
    this.active$ = store.active$.pipe(
      tap(active => {
        this.active = active;
      })
    );

    this.activeCanvas$ = store.activeCanvas$
  }

  adderClicked() {
    if (!this.active) {
      return;
    }
    console.log('Adder', this.active)
    this.store.addNewCut(this.active.id)
  }

  removerClicked() {
    if (!this.active) {
      return;
    }
    console.log('Remover', this.active)

    const selected = this.active.cuts?.find(x => x.selected)

    if (this.active.cuts && selected) {
      this.store.removeCut(this.active.id, selected.id)
    }
  }

  duplicateClicked() {
    if (this.active) {
      console.log('Duplicate')

      const selected = this.active.cuts?.find(x => x.selected)

      if (this.active.cuts && selected) {
        this.store.duplicateCut(this.active.id, selected.id)
      }
    }
  }

  zoomClicked() {
    if (!this.active) {
      return;
    }
    console.log('zoomClicked')

    const selected = this.active.cuts?.find(x => x.selected)

    if (this.active.cuts && selected) {
      this.store.zoomCut(this.active.id, selected)
    }
  }
}
