import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CanvasProps, ImageCut, ImageProps } from '../../state/cutter.store';

export interface ImageCutterResult {
  img: ImageProps,
  result: ImageCutResult[]
}

export interface ImageCutResult {
  dataURL: string,
  cut: ImageCut,
  fileType: string
}

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

  private worker: Worker;

  constructor() {
    this.worker = new Worker(new URL('../../worker/image-cutter.worker', import.meta.url))

    this.handleWorker()
  }

  private handleWorker() {
    this.worker.addEventListener('message', ({ data }) => {
      console.log('Worker finished', data)

      const cutterResult: ImageCutterResult = data
      this.downloadResult(cutterResult);
    })
  }

  private downloadResult(cutterResult: ImageCutterResult) {
    const img = cutterResult.img;
    const result = cutterResult.result

    for (let i = 0; i < result.length; i++) {
      const res = result[i]

      const fix = res.fileType.split('/').slice(-1)[0]

      const tempLink = document.createElement('a')
      let fileName = `${img.meta.name}-${res.cut.name}.${fix}`

      tempLink.download = fileName
      tempLink.href = res.dataURL

      tempLink.click()
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

    const index = this.active.cuts.findIndex(x => x.selected)
    if (index < 0) {
      console.log('ERROR: No Cut selected')
      return;
    }

    const cut = this.active.cuts[index]

    // TODO: options
    const options = {}

    this.worker.postMessage({
      active: this.active,
      cuts: [cut],
      options: {}
    })
  }

  public downloadAllCuts() {
    console.log('downloadAllCuts')
    if (!this.active || !this.activeCanvas) {
      return;
    }

    if (this.active.cuts.length > 0) {
      this.worker.postMessage({
        active: this.active,
        cuts: this.active.cuts,
        options: {}
      })
    }
  }
}
