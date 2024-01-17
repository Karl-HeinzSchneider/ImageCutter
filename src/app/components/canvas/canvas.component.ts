import { AfterViewInit, Component, ElementRef, HostListener, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageProps } from '../../state/cutter.store';
import Konva from 'konva';
import { Stage } from 'konva/lib/Stage';
import { Layer } from 'konva/lib/Layer';


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

  private stage!: Stage;
  private layerBG!: Layer;
  private layerCuts!: Layer;

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    //console.log('OnResize')
    this.resizeStage()
  }

  constructor() {
  }

  async ngAfterViewInit(): Promise<void> {
    //console.log('ngAfterViewInit')

    this.initStage()
    this.resizeStage()

  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    //console.log('ngOnChanges ss')


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

    let scale = this.image.meta.zoom
    //scale = 1

    // https://github.com/jhildenbiddle/canvas-size#test-results
    // canvas might crash when too big
    const MAX_CANVAS_SIZE = 11000;

    const maxSide = Math.max(width, height)

    if (maxSide * scale > MAX_CANVAS_SIZE) {
      scale = MAX_CANVAS_SIZE / maxSide
    }

    canvas.width = width * scale
    canvas.height = height * scale

    const ctx = canvas.getContext('2d')

    if (!ctx) {
      console.log('NO CONTEXT')
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    //ctx.reset()

    ctx.scale(scale, scale)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(this.imageBitmap, 0, 0)


    ctx.fillRect(10, 10, 100, 100)

  }

  private initStage() {
    console.log('initStage')

    this.stage = new Konva.Stage({
      height: 300,
      width: 300,
      container: 'konva'
    })

    const layerBG = new Konva.Layer({
      imageSmoothingEnabled: false
    })
    this.layerBG = layerBG
    this.stage.add(this.layerBG)

    this.layerCuts = new Konva.Layer()
    this.stage.add(this.layerCuts)
  }

  private resizeStage() {
    const wHeight = window.innerHeight
    const wWidth = window.innerWidth
    //console.log(wWidth, wHeight)


    const padding = 24

    const rHeight = wHeight - 32 - 48 - 32 - 32 - 2 * padding
    const rWidth = wWidth - 48 - 240 - 2 * padding
    //console.log(rWidth, rHeight)

    this.stage.height(rHeight)
    this.stage.width(rWidth)
  }



  private setupStage() {
    if (!this.stage || (this.id != this.image.id)) {
      console.log('SetupStage')
      this.id = this.image.id

      this.stage = new Konva.Stage({
        height: this.image.file?.height,
        width: this.image.file?.width,
        container: 'konva'
      })

      this.stage.width(this.stage.width() / 2)

      const layerBG = new Konva.Layer({
        imageSmoothingEnabled: false
      })
      this.layerBG = layerBG
      this.stage.add(this.layerBG)

      this.layerCuts = new Konva.Layer()
      this.stage.add(this.layerCuts)

      Konva.Image.fromURL(this.image.file?.dataURL!, function (node) {
        node.setAttrs({
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
        })
        layerBG.add(node)
      })
    }
    else {
      //console.log('skip SetupStage')
    }
  }

  private scaleStage() {
    //this.stage.scale({ x: 0.5, y: 1.25 })
    //this.stage.scale({ x: this.image.meta.zoom, y: this.image.meta.zoom })
    const dx = this.image.meta.zoom / 10
    this.stage.width(this.image.file?.width! * dx)
  }


}
