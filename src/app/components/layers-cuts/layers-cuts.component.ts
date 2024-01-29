import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayerBoxComponent } from '../layer-box/layer-box.component';
import { LayersCutComponent } from '../layers-cut/layers-cut.component';
import { AppRepository, ImageProps } from '../../state/cutter.store';
import { Observable, distinctUntilChanged, from, map, switchMap } from 'rxjs';

@Component({
  selector: 'app-layers-cuts',
  standalone: true,
  imports: [CommonModule, LayerBoxComponent, LayersCutComponent],
  templateUrl: './layers-cuts.component.html',
  styleUrl: './layers-cuts.component.scss'
})
export class LayersCutsComponent {

  @Input() active!: ImageProps;

  image$: Observable<HTMLImageElement>;

  constructor(private store: AppRepository) {
    const dataURL$ = store.active$.pipe(
      map(active => {
        return active?.file?.dataURL || ''
      }),
      distinctUntilChanged()
    )

    const test = from(new Promise(resolve => {
      resolve('test')
    }))

    this.image$ = dataURL$.pipe(
      switchMap(dataURL => {
        const prom: Promise<HTMLImageElement> = new Promise((resolve, reject) => {
          const img = new Image()

          img.addEventListener('load', () => {
            resolve(img)
          })

          img.src = dataURL
        })

        return prom
      })
    )
  }

  adderClicked() {
    console.log('Adder', this.active)
    this.store.addNewCut(this.active.id)
  }

  removerClicked() {
    console.log('Remover', this.active)

    const selected = this.active.cuts?.find(x => x.selected)

    if (this.active.cuts && selected) {
      this.store.removeCut(this.active.id, selected.id)
    }
  }
}
