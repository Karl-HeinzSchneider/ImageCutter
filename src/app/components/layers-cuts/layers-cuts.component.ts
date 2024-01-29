import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayerBoxComponent } from '../layer-box/layer-box.component';
import { LayersCutComponent } from '../layers-cut/layers-cut.component';
import { AppRepository, CanvasProps, ImageProps } from '../../state/cutter.store';
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

  activeCanvas$: Observable<CanvasProps>;

  constructor(private store: AppRepository) {
    this.activeCanvas$ = store.activeCanvas$

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

    /* store.activeCanvas$.subscribe(c => {
      console.log('ActiveCanvasChange', c)

      const ctx = c.canvas.getContext('2d')

      if (!ctx) {
        console.log('no ctx')
        return;
      }
      const data = ctx?.getImageData(0, 0, 100, 100)
      console.log(data)

      c.canvas.transferToImageBitmap()

      const newCanv = document.createElement('canvas')
      newCanv.getContext('2d')?.drawImage(c.canvas, 0, 0)

      const blob = c.canvas.convertToBlob().then(b => {
        const url = URL.createObjectURL(b)
        console.log(url)
      })
    }) */
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
