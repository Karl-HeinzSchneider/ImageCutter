import { AfterViewInit, Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageProps } from '../../state/cutter.store';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.scss'
})
export class CanvasComponent implements OnChanges, AfterViewInit {

  @Input() image!: ImageProps;

  @ViewChild('maincanvas', { static: false }) canvasRef!: ElementRef;

  private id: string = '-42';
  private imageBitmap!: ImageBitmap;

  constructor() {
  }

  async ngAfterViewInit(): Promise<void> {
    console.log('ngAfterViewInit')
    await this.createBitmap()
    await this.redraw()
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    console.log('ngOnChanges')

    if (this.imageBitmap) {
      await this.createBitmap()
      await this.redraw()
    }
    else {
      console.log('no image bitmap')
    }
  }

  private async createBitmap() {
    if (!this.imageBitmap || (this.id != this.image.id)) {
      console.log('createBitmap')
      this.id = this.image.id

      const blob = await fetch(this.image.file?.dataURL!).then((response) => response.blob())
      const imageBitmap = await createImageBitmap(blob)

      this.imageBitmap = imageBitmap;
    }
  }

  private async redraw() {
    const width = this.imageBitmap.width;
    const height = this.imageBitmap.height
    //console.log(width, height)

    const canvas: HTMLCanvasElement = this.canvasRef.nativeElement;

    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')

    if (!ctx) {
      console.log('NO CONTEXT')
      return;
    }
    ctx.reset()

    ctx.imageSmoothingEnabled = false
    ctx.drawImage(this.imageBitmap, 0, 0)


    ctx.fillRect(10, 10, 100, 100)

  }

}
