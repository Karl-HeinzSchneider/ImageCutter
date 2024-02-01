import { AfterViewInit, Component, ElementRef, HostListener, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppRepository, ImageCut, ImageFile, ImageMeta, ImageProps } from '../../state/cutter.store';
import Konva from 'konva';
import { Stage } from 'konva/lib/Stage';
import { Layer } from 'konva/lib/Layer';
import { Vector2d } from 'konva/lib/types';
import { Box } from 'konva/lib/shapes/Transformer';
import { NodeConfig } from 'konva/lib/Node';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { Rect } from 'konva/lib/shapes/Rect';
import { getActiveEntity } from '@ngneat/elf-entities';
import { KeypressService } from '../../state/keypress.service';


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
  private layerSelected!: Layer;

  private transformer!: Konva.Transformer;
  private rect!: Rect;

  private bgImageRef!: Konva.Image;

  private imageFile: ImageFile | undefined;
  private zoom: number = 1;
  private scroll: Vector2d = { x: 0.5, y: 0.5 };
  private selectedCut: ImageCut | undefined;
  private nonSelectedCuts: ImageCut[] | undefined;

  private scrollUpdater = new Subject<Vector2d>;
  private scrollHandler: (e: Event) => void;

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    //console.log('OnResize')
    this.resizeStage()
    this.updateScale()
    this.updateScroll()
    this.updateBGPosition()
  }

  constructor(private store: AppRepository, private keypressService: KeypressService) {
    console.log('constructor')
    //this.initSubs()

    const ref = this;
    this.scrollHandler = function (e: Event) {
      //console.log('scroll', e)
      ref.onScroll(e);
    }
  }

  private initSubs() {
    // ImageFile
    this.store.activeFile$.pipe(takeUntil(this.destroy$)).subscribe(f => {
      //console.log('file changed', f)
      this.imageFile = f;

      // #hack, need id for store update...
      const q = this.store.store.query(getActiveEntity())
      if (q) {
        this.id = q.id
      }

      this.drawStageBG()
      this.updateScale()
      this.updateScroll()
      this.updateBGPosition()
    })

    // Zoom
    this.store.zoom$.pipe(takeUntil(this.destroy$)).subscribe(zoom => {
      //console.log('zoom changed', zoom)

      this.zoom = zoom || 1;

      this.updateScale()
      this.updateScroll()
      this.updateBGPosition()
    })

    // Scroll
    this.store.scroll$.pipe(takeUntil(this.destroy$)).subscribe(scroll => {
      //console.log('scroll changed', scroll)

      this.scroll = scroll

      this.updateScale()
      this.updateScroll()
      this.updateBGPosition()
    })

    // Scroll Listener
    const scroll: HTMLDivElement = this.scrollRef.nativeElement
    scroll.addEventListener('scroll', this.scrollHandler)

    // Scroll Updater
    const scrollDebounce = 0;
    this.scrollUpdater.pipe(
      debounceTime(scrollDebounce),
      takeUntil(this.destroy$)
    ).subscribe(scroll => {
      //console.log('scrollUpdater', scroll)
      const scrollX = scroll.x;
      const scrollY = scroll.y;

      this.store.updateScroll(this.image.id, scrollX, scrollY)
    })

    // Cut selected
    this.store.selectedCut$.pipe(takeUntil(this.destroy$)).subscribe(cut => {
      //console.log('selected cut changed', cut)
      this.selectedCut = cut

      this.updateSelectedCut()
    })

    // non selected Cuts
    this.store.nonSelectedCuts$.pipe(takeUntil(this.destroy$)).subscribe(cuts => {
      //console.log('non selected cuts changed', cuts)
      this.nonSelectedCuts = cuts

      this.updateNonSelectedCuts()
    })
  }

  async ngAfterViewInit(): Promise<void> {
    console.log('ngAfterViewInit')

    if (!this.stage) {
      this.initStage()
      this.resizeStage()

      this.initTransformer()
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

    this.layerSelected = new Konva.Layer()
    this.stage.add(this.layerSelected)

    const componentRef = this;

    this.stage.on('wheel', function (e) {
      const event = e.evt;
      componentRef.onMouseWheel(event);
    })
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
      //console.log('updateScroll - before', scroll.scrollLeft, scroll.scrollTop)

      scroll.removeEventListener('scroll', this.scrollHandler)

      const scrollLeft = (scroll.scrollWidth - scroll.clientWidth) * this.scroll.x
      scroll.scrollLeft = scrollLeft

      const scrollTop = (scroll.scrollHeight - scroll.clientHeight) * this.scroll.y
      scroll.scrollTop = scrollTop

      scroll.addEventListener('scroll', this.scrollHandler)

      //console.log('updateScroll - after', scrollLeft, scrollTop)
    }
  }

  public onScroll(event: Event) {
    //console.log(event)

    const scroll: HTMLDivElement = this.scrollRef.nativeElement

    //console.log('onScroll', scroll.scrollLeft, scroll.scrollTop, `t=${event.timeStamp}`)

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

      this.scroll = { x: scrollX, y: scrollY };

      //this.store.updateScroll(this.image.id, scrollX, scrollY);
      this.scrollUpdater.next(this.scroll)

      this.updateScale()
      this.updateScroll()
      this.updateBGPosition()
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


  private initTransformer() {

    // transformer
    const tr = new Konva.Transformer({
      ignoreStroke: true,
      rotateEnabled: false,
      flipEnabled: false,
      //enabledAnchors: ['top-center', 'middle-right', 'middle-left', 'bottom-center']
      enabledAnchors: ['middle-right', 'bottom-center', 'bottom-right'],
      keepRatio: false,
      shiftBehavior: 'keepRatio'
    })
    this.transformer = tr;

    // debug text
    const text = new Konva.Text({ x: 0, y: 0, draggable: false })
    this.layerSelected.add(text)

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

    const updatePos = function () {
      //text.x(tr.x())
      //text.y(tr.y())
    }

    // rect
    const rect = new Konva.Rect({
      x: 0,
      y: 50,
      width: 10,
      height: 10,
      stroke: 'blue',
      strokeWidth: 5,
      strokeScaleEnabled: false,
      id: 'cut1',
      draggable: true
    })
    this.rect = rect
    this.layerSelected.add(rect)


    // events
    tr.nodes([rect])
    this.layerSelected.add(tr)

    updateText()
    updatePos()

    const componentRef = this;

    const updateStore = function () {
      componentRef.updateSelectedCutStore()
    }

    rect.on('dragmove', function () {
      //console.log('dragmove')

      const closestX = Math.round(rect.x())
      const closestY = Math.round(rect.y())

      //console.log(closestX, closestY)

      rect.x(closestX)
      rect.y(closestY)

      updateText()
      updatePos()
    })

    rect.on('dragend', function () {
      //console.log('dragend', rect.x(), rect.y())
      updateStore()
    })

    let startX = 0;
    let startY = 0;

    const roundRectSize = function () {
      const closestX = Math.round(rect.x())
      const closestY = Math.round(rect.y())
      //const closestX = Math.max(startX, Math.round(rect.x()))
      //const closestY = Math.max(startY, Math.round(rect.y()))

      const realWidth = Math.max(2, Math.round(rect.width() * rect.scaleX()));
      const realHeight = Math.max(2, Math.round(rect.height() * rect.scaleY()));

      rect.scaleX(1)
      rect.scaleY(1)

      rect.width(realWidth)
      rect.height(realHeight)

      rect.x(closestX)
      rect.y(closestY)

      // if (closestX < startX) {
      //   rect.x(startX)
      //   rect.width(2)
      // }
      // if (closestY < startY) {
      //   rect.y(startY)
      //   rect.height(2)
      // }

      //console.log('roundRectSize', rect.x(), rect.y(), realWidth, realHeight)
    }

    rect.on('transformstart', function () {
      //console.log('transformstart')
      startX = rect.x()
      startY = rect.y()
    })

    rect.on('transform', function () {
      //console.log('transform', tr.getActiveAnchor())

      const anchor = tr.getActiveAnchor()
      if (!anchor) {
        return;
      }

      roundRectSize()

      updateText()
      updatePos()
    })

    rect.on('transformend', function () {
      //console.log('transformend', rect.x(), rect.y(), rect.width(), rect.height())
      updateStore()
    })
  }

  private updateSelectedCut() {
    const layer = this.layerSelected

    const rect = this.rect;
    rect.remove()
    const tr = this.transformer
    tr.remove()

    const cut = this.selectedCut

    if (!cut) {
      return;
    }

    if (cut.type === 'absolute') {
      const absoluteCut = cut.absolute;

      rect.x(absoluteCut.x)
      rect.y(absoluteCut.y)
      rect.width(absoluteCut.width)
      rect.height(absoluteCut.height)
    }
    else {
      const relativeCut = cut.relative;
      return;
      // @ TODO
      // rect.x(relativeCut.x)
      // rect.y(relativeCut.y)
      // rect.width(relativeCut.width)
      //rect.height(relativeCut.height)
    }

    layer.add(rect)
    layer.add(tr)
  }

  private updateSelectedCutStore() {
    //console.log('updateSelectedCutStore')

    const cut = this.selectedCut
    const rect = this.rect;

    if (!cut) {
      return;
    }

    let newCut: ImageCut = { ...cut }

    if (cut.type === 'absolute') {
      newCut.absolute!.x = rect.x()
      newCut.absolute!.y = rect.y()

      newCut.absolute!.height = rect.height()
      newCut.absolute!.width = rect.width()

      //console.log('newCut', newCut)
      this.store.updateCut(this.id, newCut)
    }
  }

  private updateNonSelectedCuts() {

  }


  private updateCutsLayer() {

    const layerCuts = this.layerCuts
    const cut1 = this.layerCuts.findOne('#cut1')
    if (cut1) {
      layerCuts.destroyChildren()
    }

    const rect = new Konva.Rect({
      x: 0,
      y: 50,
      width: 10,
      height: 10,
      stroke: 'blue',
      strokeWidth: 5,
      strokeScaleEnabled: false,
      id: 'cut1',
      draggable: false
    })
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

  onMouseWheel(e: WheelEvent) {
    //console.log('onMouseWheel', e)

    const wheelX = e.deltaX;
    const wheelY = e.deltaY;
    //console.log('shift?', this.keypressService.isKeyPressed('Shift'))

    if (this.keypressService.isKeyPressed('Shift')) {
      this.handleWheel(wheelY, 0)
    }
    else {
      // default
      this.handleWheel(0, wheelY)
    }
  }

  private handleWheel(dx: number, dy: number) {
    //console.log('handleWheel', dx, dy)
    if (!this.scrollRef) {
      return;
    }

    const scroll: HTMLDivElement = this.scrollRef.nativeElement

    const scrollLeft = (scroll.scrollWidth - scroll.clientWidth)
    const scrollTop = (scroll.scrollHeight - scroll.clientHeight)
    //console.log(scrollLeft, scrollTop)

    const scrollX = this.image.meta.scrollX
    const scrollY = this.image.meta.scrollY

    let newScrollX = this.image.meta.scrollX;
    let newScrollY = this.image.meta.scrollY;


    if (scrollLeft > 0 && Math.abs(dx) > 0) {
      // console.log('scrollLeft and dx')

      const delta = 0.069 * Math.sign(dx);
      newScrollX = Math.min(Math.max(scrollX + delta, 0), 1)

      //console.log('scrollX', scrollX, newScrollX)
    }

    if (scrollTop > 0 && Math.abs(dy) > 0) {
      //console.log('scrollTop and dy')

      const delta = 0.069 * Math.sign(dy);
      newScrollY = Math.min(Math.max(scrollY + delta, 0), 1)

      //console.log('scrollY', scrollY, newScrollY)
    }

    if (this.image.meta.scrollX != newScrollX || this.image.meta.scrollY != newScrollY) {
      this.scroll = { x: newScrollX, y: newScrollY }
      this.scrollUpdater.next(this.scroll)

      this.updateScale()
      this.updateScroll()
      this.updateBGPosition()

      //this.store.updateScroll(this.image.id, newScrollX, newScrollY)
    }
  }
}
