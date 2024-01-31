import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanvasProps, ImageCut, ImageProps } from '../../state/cutter.store';

@Component({
  selector: 'app-exporter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exporter.component.html',
  styleUrl: './exporter.component.scss'
})
export class ExporterComponent {

  @Input() active!: ImageProps;
  @Input() activeCanvas!: CanvasProps;

  constructor() {

  }

  public printStuff(stuff: any) {
    console.log('PRINT STUFF', stuff)
  }

  private async exportSingleCut(active: ImageProps, offCanvas: OffscreenCanvas, cut: ImageCut, options: { [key: string]: string } = {}) {
    const newCanv = document.createElement('canvas')

    //newCanv.setAttribute('download', 'CanvasAsImage.png');

    const fileType = options['fileType'] || 'png'

    const ctx = newCanv.getContext('2d')
    if (!ctx) {
      console.log('ERROR: No Context')
      return;
    }

    if (cut.type === 'absolute') {
      const abs = cut.absolute;

      const w = abs.width;
      const h = abs.height;
      const dx = abs.x;
      const dy = abs.y;

      const newOff = new OffscreenCanvas(w, h)
      const offCtx = newOff.getContext('2d')
      offCtx?.drawImage(offCanvas, dx, dy, w, h, 0, 0, w, h)
      const blob = await newOff.convertToBlob({ type: 'image/' + fileType })
      const reader = new FileReader()
      reader.addEventListener('loadend', (event) => {
        const url = event.target?.result;
        console.log('readerEnd', url)

        const tempLink = document.createElement('a')
        let fileName = `${active.meta.name}-Cut.${fileType}`

        tempLink.download = fileName
        tempLink.href = dataURL

        tempLink.click()
      })
      reader.readAsDataURL(blob)

      newCanv.width = w;
      newCanv.height = h;

      ctx.clearRect(0, 0, w, h)
      ctx.drawImage(offCanvas, dx, dy, w, h, 0, 0, w, h)
      const dataURL = newCanv.toDataURL('image/' + fileType)

      const size_in_bytes = this.getFileSize(dataURL)

      //console.log(dataURL, size_in_bytes)

      const tempLink = document.createElement('a')
      let fileName = `${active.meta.name}-Cut.${fileType}`

      tempLink.download = fileName
      tempLink.href = dataURL

      //tempLink.click()
    }
    else if (cut.type === 'relative') {
    }
  }

  // https://stackoverflow.com/questions/18557497/how-to-get-html5-canvas-todataurl-file-size-in-javascript/53129276#53129276
  private getFileSize(dataURL: string) {
    let size_in_bytes = window.atob(dataURL.split(",")[1]).length;
    return size_in_bytes;
  }


  public downloadSelectedCut() {
    console.log('downloadSelectedCut')
    if (!this.active || !this.activeCanvas) {
      console.log('ERROR: refs missing')
      return;
    }

    const offCanvas: OffscreenCanvas = this.activeCanvas.canvas;

    const index = this.active.cuts.findIndex(x => x.selected)
    if (index < 0) {
      console.log('ERROR: No Cut selected')
      return;
    }

    const cut = this.active.cuts[index]

    const options = {}

    for (let i = 0; i < 10; i++) {
      this.exportSingleCut(this.active, offCanvas, cut)
    }

    //this.exportSingleCut(this.active, offCanvas, cut)
  }

  public downloadAllCuts() {
    console.log('downloadAllCuts')
    if (!this.active || !this.activeCanvas) {
      return;
    }
  }
}
