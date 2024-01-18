import { AfterViewInit, Component, ElementRef, HostListener, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppRepository, ImageFile, ImageMeta, ImageProps } from '../../state/cutter.store';
import Konva from 'konva';
import { Stage } from 'konva/lib/Stage';
import { Layer } from 'konva/lib/Layer';
import { Vector2d } from 'konva/lib/types';
import { Box } from 'konva/lib/shapes/Transformer';


@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.scss'
})
export class CanvasComponent implements OnChanges, AfterViewInit {

  @Input() image!: ImageProps;

  @ViewChild('scroll', { static: false }) scrollRef!: ElementRef;
  @ViewChild('large', { static: false }) largeRef!: ElementRef;

  private id: string = '-42';

  private stage!: Stage;
  private layerBG!: Layer;
  private layerCuts!: Layer;

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    //console.log('OnResize')
    this.resizeStage()
    this.updateScale()
    this.updateScroll()
    this.updateBGPosition()
  }

  constructor(private store: AppRepository) {
  }

  async ngAfterViewInit(): Promise<void> {
    //console.log('ngAfterViewInit')
    if (!this.stage) {
      this.initStage()
      this.resizeStage()
    }
    else {

    }

    this.drawStageBG()
    this.updateScale()
    this.updateScroll()
    this.updateBGPosition()
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    // console.log('ngOnChanges', changes)

    if (!this.stage) {
      this.initStage()
      this.resizeStage()
    }
    else {

    }

    this.drawStageBG()
    this.updateScale()
    this.updateScroll()
    this.updateBGPosition()

    this.updateCutsLayer()
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

  private drawStageBG() {
    if (this.id != this.image.id) {
      //console.log('drawStageBG - new image')
      this.id = this.image.id

      const layerBG = this.layerBG
      const bg = this.layerBG.findOne('#bg')
      if (bg) {
        layerBG.destroyChildren()
      }

      const image: ImageFile = this.image.file!;
      const componentRef = this;
      const stageRef = this.stage;

      Konva.Image.fromURL(image.dataURL, function (node) {
        const dx = image.width / 2;
        const dy = image.height / 2
        node.setAttrs({
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          offsetX: dx,
          offsetY: dy,
          id: 'bg'
        })

        //node.on('pointerdown', componentRef.pointerFunctionTest)
        //node.on('pointermove', componentRef.pointerFunctionTest)

        node.on('pointerdown', function () {
          const pointerPos = stageRef.getPointerPosition()
          console.log('point', pointerPos?.x, pointerPos?.y)
          console.log('real', componentRef.canvasToRealCoords(pointerPos!))
        })

        layerBG.add(node)
      })
    }
    else {
      //console.log('drawStageBG - same image')
    }
  }

  private getStageCenter() {
    const x = this.stage.width() / 2
    const y = this.stage.height() / 2

    return { x: x, y: y } as Vector2d
  }

  public canvasToRealCoords(canvasVector: Vector2d): Vector2d {
    const stageX = this.stage.x()
    const stageY = this.stage.y()

    const center = this.getStageCenter()

    const imageFile: ImageFile = this.image.file!;
    const imageMeta: ImageMeta = this.image.meta!;

    const scale = this.stage.scale()

    let realX = 0
    let realY = 0

    realX = canvasVector.x - center.x
    realY = canvasVector.y - center.y

    return { x: realX, y: realY }
  }

  private updateScale() {
    if (!this.largeRef) {
      return;
    }

    const scale = this.image.meta.zoom
    const padding = 24

    const image: ImageFile = this.image.file!;

    const width = image.width * scale + 2 * padding
    const height = image.height * scale + 2 * padding


    const large: HTMLDivElement = this.largeRef.nativeElement;
    large.style.width = `${width}px`
    large.style.height = `${height}px`
  }

  private updateScroll() {
    if (this.scrollRef) {
      const scroll: HTMLDivElement = this.scrollRef.nativeElement
      //scrollElement.scrollLeft =  (scrollElement.scrollWidth - scrollElement.clientWidth ) / 2;   

      const scrollLeft = (scroll.scrollWidth - scroll.clientWidth) * this.image.meta.scrollX
      scroll.scrollLeft = Math.floor(scrollLeft)

      const scrollTop = (scroll.scrollHeight - scroll.clientHeight) * this.image.meta.scrollY
      scroll.scrollTop = Math.floor(scrollTop)

      //console.log('shouldScroll', scrollLeft, scrollTop)
    }
  }

  public onScroll(event: Event) {
    //console.log(event)

    const scroll: HTMLDivElement = this.scrollRef.nativeElement

    //console.log('onScroll', scroll.scrollLeft, scroll.scrollTop)

    let scrollX = 0
    if (scroll.scrollWidth === scroll.clientWidth) {
      // no scroll => dont change
      scrollX = this.image.meta.scrollX
    }
    else {
      scrollX = scroll.scrollLeft / (scroll.scrollWidth - scroll.clientWidth)
    }

    let scrollY = 0
    if (scroll.scrollHeight === scroll.clientHeight) {
      // no scroll => dont change
      scrollY = this.image.meta.scrollY
    }
    else {
      scrollY = scroll.scrollTop / (scroll.scrollHeight - scroll.clientHeight)
    }

    //console.log('newScroll', scrollX, scrollY)

    if (this.image.meta.scrollX != scrollX || this.image.meta.scrollY != scrollY) {
      this.store.updateScroll(this.image.id, scrollX, scrollY)
    }
    else {
      ///console.log('same')
    }

  }

  private updateBGPosition() {
    if (!this.scrollRef) {
      return;
    }

    const scroll: HTMLDivElement = this.scrollRef.nativeElement

    const center = this.getStageCenter()

    // scale
    const scale = this.image.meta.zoom
    this.stage.scale({ x: scale, y: scale })


    const imageFile: ImageFile = this.image.file!;
    const imageMeta: ImageMeta = this.image.meta!;

    // X 
    let dx = center.x;

    if (scroll.scrollWidth === scroll.clientWidth) {
      // no scroll => dont change   

    }
    else {
      dx = center.x + (0.5 - imageMeta.scrollX) * (scroll.scrollWidth - scroll.clientWidth)
    }
    this.stage.x(dx)


    // Y
    let dy = center.y;

    if (scroll.scrollHeight === scroll.clientHeight) {
      // no scroll => dont change         
    }
    else {
      dy = center.y + (0.5 - imageMeta.scrollY) * (scroll.scrollHeight - scroll.clientHeight)
    }
    this.stage.y(dy)
  }


  private updateCutsLayer() {

    const layerCuts = this.layerCuts
    const cut1 = this.layerCuts.findOne('#cut1')
    if (cut1) {
      layerCuts.destroyChildren()
    }

    const rect = new Konva.Rect({ x: -10, y: -10, width: 10, height: 10, stroke: 'blue', strokeWidth: 5, strokeScaleEnabled: false, id: 'cut1' })
    layerCuts.add(rect)


    const updateText = function () {
      const lines = [
        'x: ' + rect.x(),
        'y: ' + rect.y(),
        'rotation: ' + rect.rotation(),
        'width: ' + rect.width(),
        'height: ' + rect.height(),
        'scaleX: ' + rect.scaleX(),
        'scaleY: ' + rect.scaleY(),
      ];
      text.text(lines.join('\n'));
    }

    const text = new Konva.Text({ x: -70, y: -50 })
    layerCuts.add(text)
    updateText()

    const imageFile: ImageFile = this.image.file!;


    const tr = new Konva.Transformer({
      ignoreStroke: true,
      rotateEnabled: false,
      flipEnabled: false
    })
    layerCuts.add(tr)
    tr.nodes([rect])

    rect.on('dragmove', function () {
      updateText()
    })

    rect.on('transform', function () {
      console.log('transform', tr.getActiveAnchor())

      //return;

      const snapX = imageFile.width % 2 == 0 ? 0 : 0.5
      const snapY = imageFile.height % 2 == 0 ? 0 : 0.5


      const closestX = Math.round(this.x())
      const closestY = Math.round(this.y())

      this.x(closestX)
      this.y(closestY)

      // this.width(Math.max(2, Math.round(this.width() * this.scaleX())))
      // this.height(Math.max(2, Math.round(this.height() * this.scaleY())))

      //this.scaleX(1)
      // this.scaleY(1)


      updateText()
    })

    rect.on('transformstart', function () {
      console.log('transformstart', rect.attrs)
      updateText()
    })

    rect.on('transformend', function () {
      console.log('transformend', rect.attrs)
      updateText()
    })


    const boundBoxFunc = tr.boundBoxFunc()
    tr.boundBoxFunc(function (oldBox: Box, newBox: Box) {
      //console.log(newBox)
      return newBox
    })


  }
}
