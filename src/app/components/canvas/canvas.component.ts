import { AfterViewInit, Component, ElementRef, HostListener, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppRepository, ImageFile, ImageMeta, ImageProps } from '../../state/cutter.store';
import Konva from 'konva';
import { Stage } from 'konva/lib/Stage';
import { Layer } from 'konva/lib/Layer';
import { Vector2d } from 'konva/lib/types';
import { Box } from 'konva/lib/shapes/Transformer';
import { NodeConfig } from 'konva/lib/Node';
import { Subject, takeUntil } from 'rxjs';


@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.scss'
})
export class CanvasComponent implements OnChanges, AfterViewInit, OnDestroy {
  private readonly destroy$ = new Subject<number>()

  @Input() image!: ImageProps;

  @ViewChild('scroll', { static: false }) scrollRef!: ElementRef;
  @ViewChild('large', { static: false }) largeRef!: ElementRef;

  private id: string = '-42';

  private stage!: Stage;
  private layerBG!: Layer;
  private layerCuts!: Layer;

  private bgImageRef!: Konva.Image;

  private imageFile: ImageFile | undefined;
  private zoom: number = 1;
  private scroll: Vector2d = { x: 0.5, y: 0.5 };


  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    //console.log('OnResize')
    this.resizeStage()
    this.updateScale()
    this.updateScroll()
    this.updateBGPosition()
  }

  constructor(private store: AppRepository) {
    console.log('constructor')
    //this.initSubs()
  }

  private initSubs() {
    // ImageFile
    this.store.activeFile$.pipe(takeUntil(this.destroy$)).subscribe(f => {
      console.log('file changed', f)
      this.imageFile = f;

      this.drawStageBG()
      this.updateScale()
      this.updateScroll()
      this.updateBGPosition()
    })

    // Zoom
    this.store.zoom$.pipe(takeUntil(this.destroy$)).subscribe(zoom => {
      console.log('zoom changed', zoom)

      this.zoom = zoom || 1;

      this.updateScale()
      this.updateScroll()
      this.updateBGPosition()
    })

    // Scroll
    this.store.scroll$.pipe(takeUntil(this.destroy$)).subscribe(scroll => {
      console.log('scroll changed', scroll)

      this.scroll = scroll

      this.updateScale()
      this.updateScroll()
      this.updateBGPosition()
    })

    // Cut selected
    this.store.selectedCut$.pipe(takeUntil(this.destroy$)).subscribe(cut => {
      console.log('selected cut changed', cut)

    })
  }

  async ngAfterViewInit(): Promise<void> {
    console.log('ngAfterViewInit')

    if (!this.stage) {
      this.initStage()
      this.resizeStage()
    }

    this.initSubs()
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    //console.log('ngOnChanges', changes)  
  }

  ngOnDestroy(): void {
    this.destroy$.next(1)
    this.destroy$.complete()
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
    if (!this.imageFile) {
      return;
    }

    //console.log('drawStageBG - new image')

    const layerBG = this.layerBG
    const bg = this.layerBG.findOne('#bg')
    if (bg) {
      layerBG.destroyChildren()
    }

    const image: ImageFile = this.imageFile;
    const componentRef = this;
    const stageRef = this.stage;

    Konva.Image.fromURL(image.dataURL, function (node) {
      const dx = image.width / 2;
      const dy = image.height / 2
      node.setAttrs({
        x: dx,
        y: dy,
        scaleX: 1,
        scaleY: 1,
        offsetX: dx,
        offsetY: dy,
        id: 'bg'
      })

      componentRef.bgImageRef = node;

      stageRef.offset({ x: dx, y: dy })
      //node.on('pointerdown', componentRef.pointerFunctionTest)
      //node.on('pointermove', componentRef.pointerFunctionTest)

      node.on('pointerdown', function () {
        const pointerPos = stageRef.getPointerPosition()
        console.log('point', pointerPos?.x, pointerPos?.y)
        console.log('relative', componentRef.getRelativePointerCoords())
      })

      layerBG.add(node)
    })

  }

  private getStageCenter() {
    const x = this.stage.width() / 2
    const y = this.stage.height() / 2

    return { x: x, y: y } as Vector2d
  }

  public getRelativePointerCoords(): Vector2d | null {
    if (!this.bgImageRef) {
      return null
    }
    else {
      const relPos = this.bgImageRef.getRelativePointerPosition()
      return relPos;
    }
  }

  private updateScale() {
    if (!this.largeRef || !this.imageFile) {
      return;
    }

    const scale = this.zoom
    const padding = 24

    const image: ImageFile = this.imageFile;

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

      const scrollLeft = (scroll.scrollWidth - scroll.clientWidth) * this.scroll.x
      scroll.scrollLeft = Math.floor(scrollLeft)

      const scrollTop = (scroll.scrollHeight - scroll.clientHeight) * this.scroll.y
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
    const scale = this.zoom
    this.stage.scale({ x: scale, y: scale })

    const scrollX = this.scroll.x
    const scrollY = this.scroll.y

    // X 
    let dx = center.x;

    if (scroll.scrollWidth === scroll.clientWidth) {
      // no scroll => dont change   

    }
    else {
      dx = center.x + (0.5 - scrollX) * (scroll.scrollWidth - scroll.clientWidth)
    }
    this.stage.x(dx)


    // Y
    let dy = center.y;

    if (scroll.scrollHeight === scroll.clientHeight) {
      // no scroll => dont change         
    }
    else {
      dy = center.y + (0.5 - scrollY) * (scroll.scrollHeight - scroll.clientHeight)
    }
    this.stage.y(dy)
  }


  private updateCutsLayer() {

    const layerCuts = this.layerCuts
    const cut1 = this.layerCuts.findOne('#cut1')
    if (cut1) {
      layerCuts.destroyChildren()
    }



    const rect = new Konva.Rect({ x: 0, y: 50, width: 10, height: 10, stroke: 'blue', strokeWidth: 5, strokeScaleEnabled: false, id: 'cut1', draggable: false })
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

    const text = new Konva.Text({ x: -70, y: -50, draggable: false })
    layerCuts.add(text)
    updateText()

    const imageFile: ImageFile = this.image.file!;

    console.log('Tester', Math.ceil(-1.5))

    const tr = new Konva.Transformer({
      ignoreStroke: true,
      rotateEnabled: false,
      flipEnabled: false,
      nodes: [rect],
    })
    layerCuts.add(tr)

    const stageRef = this.stage;

    tr.on('dragmove', function () {
      console.log('dragmove')

      const closestX = Math.ceil(this.x())
      const closestY = Math.ceil(this.y())

      const newBoundBox: Box = {
        x: 0,
        y: 0,
        width: this.width(),
        height: this.width(),
        rotation: 0
      }

      this.position(newBoundBox)

      stageRef.draw()

      //this.x(closestX)
      //this.y(closestY)


      updateText()
    })

    rect.on('transform', function () {
      console.log('transform', tr.getActiveAnchor())

      return;

      const closestX = Math.ceil(this.x())
      const closestY = Math.ceil(this.y())

      this.x(closestX)
      this.y(closestY)

      this.width(Math.max(2, Math.ceil(this.width() * this.scaleX())))
      this.height(Math.max(2, Math.ceil(this.height() * this.scaleY())))

      this.scaleX(1)
      this.scaleY(1)


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
  }
}
