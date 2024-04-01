import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { getActiveEntity } from '@ngneat/elf-entities';
import Konva from 'konva';
import { Layer } from 'konva/lib/Layer';
import { Stage } from 'konva/lib/Stage';
import { LabelConfig, TagConfig } from 'konva/lib/shapes/Label';
import { Rect, RectConfig } from 'konva/lib/shapes/Rect';
import { TextConfig } from 'konva/lib/shapes/Text';
import { Vector2d } from 'konva/lib/types';
import { Subject, asyncScheduler, debounceTime, takeUntil, throttleTime } from 'rxjs';
import { AppRepository, ImageCut, ImageFile, ImageProps } from '../../state/cutter.store';
import { convertAbsoluteToRelative } from '../../state/global.helper';
import { KeypressService } from '../../state/keypress.service';
import { CanvasInfoComponent } from './canvas-info/canvas-info.component';
import { CanvasService } from './canvas.service';


@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule, CanvasInfoComponent],
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
  private layerCheckered!: Layer;
  private layerBG!: Layer;
  private layerCuts!: Layer;
  private layerSelected!: Layer;

  private transformer!: Konva.Transformer;
  private transformerTextOrigin!: Konva.Text;
  private transformerTextX!: Konva.Text;
  private transformerTextY!: Konva.Text;

  private transformerLabelOrigin!: Konva.Label;
  private transformerLabelX!: Konva.Label;
  private transformerLabelY!: Konva.Label;

  private hoverLabel!: Konva.Label;
  private hoverTag!: Konva.Tag;
  private hoverText!: Konva.Text;

  private moveUpdater = new Subject<ImageCut>;

  private rect!: Rect;

  private bgImageRef!: Konva.Image;

  private imageFile: ImageFile | undefined;
  private zoom: number = 1;
  private scroll: Vector2d = { x: 0.5, y: 0.5 };
  private selectedCut: ImageCut | undefined;
  private nonSelectedCuts: ImageCut[] | undefined;
  private mouseoverCutID: string = '';

  private scrollUpdater = new Subject<Vector2d>;
  private scrollHandler: (e: Event) => void;

  private pointerCoordsUpdater = new Subject<Vector2d | null>;

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    //console.log('OnResize')
    this.resizeStage()
    this.updateScale()
    this.updateScroll()
    this.updateBGPosition()
  }

  constructor(private store: AppRepository, private keypressService: KeypressService, private canvasService: CanvasService) {
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

      this.drawCheckered()
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

      this.updateTransformerText()
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

      this.showTransformerText(cut ? true : false)

      this.updateSelectedCut()
    })

    // non selected Cuts
    this.store.nonSelectedCuts$.pipe(takeUntil(this.destroy$)).subscribe(cuts => {
      //console.log('non selected cuts changed', cuts)
      this.nonSelectedCuts = cuts

      this.updateNonSelectedCuts()
    })

    // mouseover Cut
    this.canvasService.mouseoverCutID$.pipe(takeUntil(this.destroy$)).subscribe(id => {
      // console.log('MouseoverCutID', id)
      this.mouseoverCutID = id;

      this.updateMouseoverCut()
    })

    // pointerCoordsUpdater
    const pointerCoordsThrottle = 25;
    this.pointerCoordsUpdater.pipe(
      throttleTime(pointerCoordsThrottle, asyncScheduler, { leading: true, trailing: true }),
      takeUntil(this.destroy$)
    ).subscribe(coords => {
      //console.log('pointerCoordsUpdater', coords);
      // this.canvasService.updateMouseoverCoords(coords);
      let relCoords = this.getRelativePointerCoords();
      if (relCoords) {
        relCoords.x = Math.round(relCoords.x);
        relCoords.y = Math.round(relCoords.y);
      }
      this.canvasService.updateMouseoverCoords(relCoords);
    })

    // key down repeat
    this.keypressService.keyDownRepeat$.pipe(takeUntil(this.destroy$)).subscribe(key => {
      //console.log('key', key)

      // TODO: implement focus
      //this.handleKeypress(key)
    })

    const moveThrottle = 150;
    this.moveUpdater.pipe(
      throttleTime(moveThrottle),
      takeUntil(this.destroy$)
    ).subscribe(cut => {
      this.store.updateCut(this.id, cut)
    })
  }

  async ngAfterViewInit(): Promise<void> {
    console.log('ngAfterViewInit')

    if (!this.stage) {
      this.initStage()
      this.resizeStage()

      this.initTransformer()
      this.initTransformerText()
      this.initHoverText()
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

  private handleKeypress(key: string) {
    //console.log('handleKeypress', key)   
    switch (key) {
      case 'ArrowUp':
        {
          this.moveSelectedCut(0, -1);
          break;
        }
      case 'ArrowDown':
        {
          this.moveSelectedCut(0, 1);
          break;
        }
      case 'ArrowLeft':
        {
          this.moveSelectedCut(-1, 0);
          break;
        }

      case 'ArrowRight':
        {
          this.moveSelectedCut(1, 0);
          break;
        }

      default:
        break;
    }
  }

  private initStage() {
    console.log('initStage')

    this.stage = new Konva.Stage({
      height: 300,
      width: 300,
      container: 'konva'
    })

    this.layerCheckered = new Konva.Layer({ imageSmoothingEnabled: false })
    this.stage.add(this.layerCheckered);

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

    this.stage.on('pointermove', function (e: any) {
      // console.log(e);
      //componentRef.updatePointerCoords();
      //console.log('pointermove stage', componentRef.getRelativePointerCoords());
      componentRef.updatePointerCoords()
    })

    this.stage.on('pointerleave', function (e: any) {
      // console.log('pointerleave');

    })
  }

  public leave() {
    //console.log('pointerleave');
    this.updatePointerCoords()
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

  private async drawCheckered() {
    if (!this.imageFile) {
      return;
    }

    const layer = this.layerCheckered
    const bg = layer.findOne('#bg')
    if (bg) {
      layer.destroyChildren()
    }

    const image: ImageFile = this.imageFile;
    const componentRef = this;
    const stageRef = this.stage;

    const squareSize = 1000;

    const amountX = Math.ceil(image.width / squareSize);
    const amountY = Math.ceil(image.height / squareSize);

    //console.log('drawCheckered', amountX, amountY, amountX * amountY);

    const rect = new Konva.Rect({
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
      draggable: false,
      id: 'bg',
      fill: 'rgba(0, 0, 0, 0)'
    })
    layer.add(rect)

    //const url = '../../../../assets/img/checkered.png'
    const url = '../assets/img/checkered.png'

    const fixedUrl = new URL(url, import.meta.url);
    console.log(url, fixedUrl);

    const loadImage = (url: string) => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.onload = function () {
          resolve(img)
        }
        img.src = url
      })
    }

    const checkered = await loadImage(fixedUrl.href);

    for (let i = 0; i < amountX; i++) {
      for (let j = 0; j < amountY; j++) {
        const w = Math.min(squareSize, image.width - i * squareSize);
        const h = Math.min(squareSize, image.height - j * squareSize);

        const rect = new Konva.Rect({
          x: i * squareSize,
          y: j * squareSize,
          width: w,
          height: h,
          fillPatternImage: checkered
        })
        layer.add(rect);
      }
    }

    layer.cache()
    //console.log(layer.toDataURL({ x: 0, y: 0, width: 100, height: 100, mimeType: 'png', quality: 1, pixelRatio: 1 }))
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

      node.on('pointerclick', function () {
        const pointerPos = stageRef.getPointerPosition()
        //console.log('point', pointerPos?.x, pointerPos?.y)
        //console.log('relative', componentRef.getRelativePointerCoords())
        if (componentRef.image.meta.tool != 'select') {
          componentRef.store.selectCut(componentRef.id, undefined);
        }
      })

      /*  node.on('pointermove', function (e: any) {
         //console.log(e);
         componentRef.updatePointerCoords();
       }) */

      /*     node.on('pointerleave', function (e: any) {
            //console.log(e);
            componentRef.updatePointerCoords({ x: -1, y: -1 });
            //console.log('pointerleave');
          })
     */
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
      let relPos = this.bgImageRef.getRelativePointerPosition()
      //console.log(relPos);
      if (!relPos) {
        return null
      }

      relPos.x = Math.ceil(relPos.x);
      relPos.y = Math.ceil(relPos.y);

      if (relPos.x <= 0 || relPos.x > this.image.file.width || relPos.y <= 0 || relPos.y > this.image.file.height) {
        return null;
      }
      //console.log(relPos);
      return relPos;
    }
  }

  public updatePointerCoords(setCoords?: Vector2d) {
    this.pointerCoordsUpdater.next(null);
    return;

    /* let coords: Vector2d = { x: -1, y: -1 };
    //console.log('setCoords', setCoords);
    if (1 + 1 === 2) {
      this.pointerCoordsUpdater.next(null);

      return;
    }

    if (setCoords) {
      coords.x = Math.round(setCoords.x);
      coords.y = Math.round(setCoords.y);

      this.canvasService.updateMouseoverCoords(coords);
    }
    else {
      const relCoords = this.getRelativePointerCoords();

      if (!relCoords) {
        //this.canvasService.updateMouseoverCoords(null);
        this.pointerCoordsUpdater.next(null);

        return;
      }

      coords.x = Math.round(relCoords.x);
      coords.y = Math.round(relCoords.y);

      this.pointerCoordsUpdater.next(coords);
    } */
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
    //this.layerSelected.add(text)

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
      stroke: '#00A5A5',
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

    rect.on('mouseenter', function () {
      componentRef.updateCursor('move')
    })

    rect.on('mouseleave', function () {
      componentRef.updateCursor('default')
    })

    /*   rect.on('pointermove', function (e: any) {
        // console.log(e);
        componentRef.updatePointerCoords();
      }) */

    /* rect.on('pointerleave', function (e: any) {
      //console.log(e);
      componentRef.updatePointerCoords({ x: -1, y: -1 });
      //console.log('pointerleave');
    }) */

    rect.on('dragmove', function () {
      //console.log('dragmove')

      const closestX = Math.round(rect.x())
      const closestY = Math.round(rect.y())

      //console.log(closestX, closestY)

      rect.x(closestX)
      rect.y(closestY)

      updateText()
      updatePos()

      componentRef.updateTransformerText()
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

      componentRef.updateTransformerText()
    })

    rect.on('transformend', function () {
      //console.log('transformend', rect.x(), rect.y(), rect.width(), rect.height())
      updateStore()
    })
  }

  private initTransformerText() {
    const rect = this.transformer;

    const textCfg: TextConfig = {
      x: 0,
      y: 0,
      draggable: false,
      fontFamily: 'Inter',
      fontSize: 16,
      fill: 'orange',
      padding: 0
    }

    // text origin
    const textOrigin = new Konva.Text(textCfg)
    this.transformerTextOrigin = textOrigin;
    this.layerSelected.add(textOrigin)

    // text Y
    const textY = new Konva.Text(textCfg)
    this.transformerTextY = textY;
    this.layerSelected.add(textY)


    const labelCfg: LabelConfig = {
      x: 0,
      y: 0,
    }

    const tagCfg: TagConfig = {
      fill: '#24262B'
    }

    // Label Origin
    {
      const labelOrigin = new Konva.Label(labelCfg)
      this.transformerLabelOrigin = labelOrigin;
      this.layerSelected.add(labelOrigin)

      const tagOrigin = new Konva.Tag(tagCfg)
      labelOrigin.add(tagOrigin)

      // text Origin
      const textOrigin = new Konva.Text(textCfg)
      this.transformerTextOrigin = textOrigin;
      labelOrigin.add(textOrigin)
    }

    // Label X
    {
      const labelX = new Konva.Label(labelCfg)
      this.transformerLabelX = labelX;
      this.layerSelected.add(labelX)

      const tagX = new Konva.Tag(tagCfg)
      labelX.add(tagX)

      // text X
      const textX = new Konva.Text(textCfg)
      this.transformerTextX = textX;
      labelX.add(textX)
    }

    // Label Y
    {
      const labelY = new Konva.Label(labelCfg)
      this.transformerLabelY = labelY;
      this.layerSelected.add(labelY)

      const tagY = new Konva.Tag(tagCfg)
      labelY.add(tagY)

      // text Y
      const textY = new Konva.Text(textCfg)
      this.transformerTextY = textY;
      labelY.add(textY)
    }

  }

  private showTransformerText(show: boolean) {
    const layer = this.layerSelected;

    const labelOrigin = this.transformerLabelOrigin;
    const labelX = this.transformerLabelX;
    const labelY = this.transformerLabelY;

    if (show) {
      layer.add(labelOrigin)
      layer.add(labelX)
      layer.add(labelY)
    }
    else {
      labelOrigin.remove()
      labelX.remove()
      labelY.remove()
    }
  }

  private updateTransformerText() {
    //console.log('updateTransformerText')
    const rect = this.rect;

    const zoom = this.zoom;
    const defaultFontSize = 16;

    const newFontSize = Math.max(defaultFontSize / zoom, 5);

    // text origin    
    {
      const textOrigin = this.transformerTextOrigin;
      const labelOrigin = this.transformerLabelOrigin;

      const lines = [
        'x:' + rect.x(),
        'y:' + rect.y()
      ];
      textOrigin.text(lines.join('\n'));
      textOrigin.fontSize(newFontSize)

      labelOrigin.x(rect.x());
      labelOrigin.y(rect.y());

      const margin = 1;
      labelOrigin.offsetY(labelOrigin.height() + margin)
      labelOrigin.offsetX(labelOrigin.width() + margin)
    }

    // text X
    {
      const textX = this.transformerTextX;
      const labelX = this.transformerLabelX;

      const width = rect.width()

      textX.text(`${width}`)
      textX.fontSize(newFontSize)

      labelX.x(rect.x() + width / 2)
      labelX.y(rect.y())

      const margin = 2;
      labelX.offsetX(labelX.width() / 2)
      labelX.offsetY(labelX.height() + margin)

    }

    // text Y
    {
      const textY = this.transformerTextY
      const labelY = this.transformerLabelY;

      const height = rect.height()

      textY.text(`${height}`)
      textY.fontSize(newFontSize)

      labelY.x(rect.x())
      labelY.y(rect.y() + height / 2)

      const margin = 2;
      labelY.offsetX(labelY.width() + margin)
      //textY.offsetY(textX.height() + margin)

    }
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

    const absoluteCut = cut.absolute;

    rect.x(absoluteCut.x)
    rect.y(absoluteCut.y)
    rect.width(absoluteCut.width)
    rect.height(absoluteCut.height)


    layer.add(rect)
    layer.add(tr)

    this.updateTransformerText()
  }

  private updateSelectedCutStore() {
    //console.log('updateSelectedCutStore')

    const cut = this.selectedCut
    const rect = this.rect;

    if (!cut) {
      return;
    }

    let newCut: ImageCut = { ...cut }

    newCut.absolute!.x = rect.x()
    newCut.absolute!.y = rect.y()

    newCut.absolute!.height = rect.height()
    newCut.absolute!.width = rect.width()

    newCut.relative = convertAbsoluteToRelative(newCut.absolute, { x: this.imageFile!.width, y: this.imageFile!.height })

    //console.log('newCut', newCut)
    this.store.updateCut(this.id, newCut)
  }

  private moveSelectedCut(dx: number, dy: number) {
    const cut = this.selectedCut

    if (!cut) {
      return;
    }

    let newCut: ImageCut = { ...cut }

    if (cut.type === 'absolute') {
      newCut.absolute.x = newCut.absolute.x + dx
      newCut.absolute.y = newCut.absolute.y + dy

      //this.store.updateCut(this.id, newCut)
      this.moveUpdater.next(newCut)

      this.selectedCut = newCut
      this.updateSelectedCut()
    }
  }
  // 171719  rgba(0, 0, 0, 0.69)
  private rectColor = '#171719';
  //private rectColor = 'orange';

  private rectColorSelected = '#00A5A5'

  private updateNonSelectedCuts() {
    const layer = this.layerCuts;

    layer.removeChildren()

    const nodes = layer.find('')

    const cuts = this.nonSelectedCuts;

    if (!cuts || cuts.length < 1) {
      // no cuts
      return;
    }

    const rectCfg: RectConfig = {
      stroke: this.rectColor,
      strokeWidth: 3,
      strokeScaleEnabled: false,
      id: '123',
      draggable: false
    }

    const componentRef = this;

    cuts.forEach(cut => {
      if (cut.visible) {
        const abs = cut.absolute;

        const rect = new Konva.Rect({
          ...rectCfg,
          x: abs.x,
          y: abs.y,
          width: abs.width,
          height: abs.height,
          id: cut.id,
          name: 'rect'
        })
        rect.dash([8, 1])

        rect.setAttr('cut', cut)

        rect.on('mouseenter', function () {
          componentRef.updateCursor('pointer');
          componentRef.updateHoverLabel(rect);

          rect.stroke(componentRef.rectColorSelected)
        })

        rect.on('mouseleave', function () {
          componentRef.updateCursor('default');
          componentRef.updateHoverLabel(undefined);

          //rect.stroke('#171719')
          rect.stroke(componentRef.rectColor)
        })

        rect.on('pointerclick', function (e) {
          componentRef.onRectPointerClick(cut)
        })

        /*      rect.on('pointermove', function (e: any) {
               // console.log(e);
               componentRef.updatePointerCoords();
             }) */

        /*    rect.on('pointerleave', function (e: any) {
             //console.log(e);
             componentRef.updatePointerCoords({ x: -1, y: -1 });
             //console.log('pointerleave');
           })
    */
        layer.add(rect)
      }
    })
  }

  private updateMouseoverCut() {
    const id = this.mouseoverCutID;
    const layer = this.layerCuts;

    const rects: Rect[] = layer.find('.rect')

    let found = false;

    rects.forEach(rect => {
      const cut: ImageCut = rect.getAttr('cut')

      if (cut.id === id) {
        rect.stroke(this.rectColorSelected)
        this.updateHoverLabel(rect)
        found = true;
      }
      else {
        rect.stroke(this.rectColor)
      }
    })

    if (found) {
      return;
    }
    else {
      this.updateHoverLabel(undefined)
    }
  }

  private updateCursor(cursor: 'default' | 'pointer' | 'move' | 'crosshair') {
    this.stage.container().style.cursor = cursor;
  }

  private onRectPointerClick(cut: ImageCut) {
    //console.log('onRectPointerClick', cut);
    this.updateHoverLabel(undefined)
    this.store.selectCut(this.id, cut)
  }

  private initHoverText() {
    const layer = this.layerCuts;

    const label = new Konva.Label({});
    this.hoverLabel = label;
    //layer.add(label)

    const tag = new Konva.Tag({
      fill: '#24262B',
      pointerDirection: 'down',
      pointerWidth: 3,
      pointerHeight: 3,
      lineJoin: 'round',
    });
    this.hoverTag = tag;
    label.add(tag);

    const text = new Konva.Text({
      x: 0,
      y: 0,
      draggable: false,
      fontFamily: 'Inter',
      fontSize: 16,
      fill: 'orange',
      padding: 0
    });

    this.hoverText = text;
    label.add(text);
  }

  private updateHoverLabel(rect: Rect | undefined) {
    const layer = this.layerCuts;

    const label = this.hoverLabel;
    const tag = this.hoverTag;
    const text = this.hoverText;

    // label.remove()
    label.remove();
    tag.remove()
    text.remove()

    if (!rect) {
      //console.log('!rect');
      return;
    }

    //console.log('updateHoverLabel', label, tag, text);

    const cut = rect.getAttr('cut') as ImageCut;

    // text
    text.text(cut.name)

    const zoom = this.zoom;
    const defaultFontSize = 16;

    const newFontSize = Math.max(defaultFontSize / zoom, 5);
    text.fontSize(newFontSize)

    // position
    const margin = 2;

    label.x(rect.x() + rect.width() / 2);
    label.y(rect.y());

    //label.offsetX(label.width() / 2)
    //label.offsetY(label.height() + margin)

    //layer.add(label)

    label.add(tag)
    label.add(text)

    layer.add(label);

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
