import { AfterViewInit, Component, HostListener, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Stage } from 'konva/lib/Stage';
import { Layer } from 'konva/lib/Layer';
import Konva from 'konva';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { AppRepository, ImageFile } from '../../../state/cutter.store';
import { getActiveEntity } from '@ngneat/elf-entities';
import { Rect } from 'konva/lib/shapes/Rect';
import { Vector2d } from 'konva/lib/types';

@Component({
  selector: 'app-canvas-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canvas-preview.component.html',
  styleUrl: './canvas-preview.component.scss'
})
export class CanvasPreviewComponent implements AfterViewInit, OnChanges, OnDestroy {
  private readonly destroy$ = new Subject<number>()

  private updateSubject = new Subject<Vector2d>;

  private stage!: Stage;
  private layerBG!: Layer;
  private layerRect!: Layer;

  private rect!: Rect;
  private dragging: boolean = false;

  private id: string = '-42';
  private imageFile: ImageFile | undefined;
  private zoom: number = 1;
  private scroll: Vector2d = { x: 0.5, y: 0.5 };

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.updateRect()
  }


  constructor(private store: AppRepository) {
  }

  ngOnChanges(changes: SimpleChanges): void {

  }

  ngAfterViewInit(): void {
    if (!this.stage) {
      this.initStage()
      this.initRect()

      this.initSubs()
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next(1)
    this.destroy$.complete()
  }

  private initStage() {
    this.stage = new Konva.Stage({
      height: 117,
      width: 208,
      container: 'preview'
    })

    const layerBG = new Konva.Layer({
      imageSmoothingEnabled: false
    })
    this.layerBG = layerBG
    this.stage.add(this.layerBG)

    const layerRect = new Konva.Layer({
      imageSmoothingEnabled: false
    })
    this.layerRect = layerRect
    this.stage.add(this.layerRect)
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

      this.drawBG()
      this.updateRect();
    })

    // Zoom
    this.store.zoom$.pipe(takeUntil(this.destroy$)).subscribe(zoom => {
      //console.log('zoom changed', zoom)

      this.zoom = zoom || 1;
      this.updateRect();
    })

    // Scroll
    this.store.scroll$.pipe(takeUntil(this.destroy$)).subscribe(scroll => {
      //console.log('scroll changed', scroll)

      this.scroll = scroll
      this.updateRect()
    })

    // update Sub

    this.updateSubject.pipe(
      debounceTime(5),
      takeUntil(this.destroy$)
    ).subscribe(value => {
      //console.log('updateSubject', value)
      this.store.updateScroll(this.id, value.x, value.y)
      //this.store.updateZoom(value[0], value[1])
    })
  }

  private drawBG() {
    const file = this.imageFile
    if (!file) {
      return;
    }
    const stageRef = this.stage;
    const maxH = 117
    const maxW = 208

    const url = file.dataURL

    const h = file.height;
    const w = file.width;

    const hScale = maxH / h;
    const wScale = maxW / w

    const scale = Math.min(hScale, wScale)

    const dx = (maxW - w * scale) / 2
    const dy = (maxH - h * scale) / 2

    //console.log(hScale, wScale, scale, dx, dy)

    const layerRef = this.layerBG;
    const bg = layerRef.findOne('#previewBG')
    if (bg) {
      layerRef.destroyChildren()
    }

    Konva.Image.fromURL(url, function (node) {
      node.setAttrs({
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        id: 'previewBG'
      })

      layerRef.add(node)
    })

    stageRef.width(w * scale)
    stageRef.height(h * scale)
    stageRef.scale({ x: scale, y: scale })

  }

  private initRect() {
    const rect = new Konva.Rect({
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      stroke: 'orange',
      strokeWidth: 2,
      strokeScaleEnabled: false,
      id: 'previewRect',
      draggable: true
    })

    const componentRef = this;

    rect.on('dragstart', function () {
      componentRef.dragging = true
    })

    rect.on('dragend', function () {
      componentRef.dragging = false
    })

    rect.on('dragmove', function () {
      const imageW = componentRef.imageFile?.width || 0
      const imageH = componentRef.imageFile?.height || 0

      const newX = Math.max(0, Math.min(this.x(), imageW - this.width()))
      const newY = Math.max(0, Math.min(this.y(), imageH - this.height()))


      this.x(newX)
      this.y(newY)

      componentRef.updateStoreFromRect()
    })

    this.rect = rect
    this.layerRect.add(rect)
  }

  private updateStoreFromRect() {
    const rect = this.rect
    const file = this.imageFile;

    if (!file) {
      return;
    }

    const dx = (file.width - rect.width())
    const dy = (file.height - rect.height())

    const newScrollX = dx != 0 ? rect.x() / dx : 0.5
    const newScrollY = dy != 0 ? rect.y() / dy : 0.5

    //console.log('newScroll', newScrollX, newScrollY)
    this.updateSubject.next({ x: newScrollX, y: newScrollY })
  }


  private updateRect() {
    const file = this.imageFile
    if (!file || this.dragging) {
      return;
    }

    // big stage size
    // see: canvas.component - resizeStage()
    const wHeight = window.innerHeight
    const wWidth = window.innerWidth

    const padding = 24

    const rHeight = wHeight - 32 - 48 - 32 - 32 - 2 * padding
    const rWidth = wWidth - 48 - 240 - 2 * padding

    const scale = this.zoom;
    const scroll = this.scroll;

    const zoomX = rWidth / (file.width * scale)
    const zoomY = rHeight / (file.height * scale)

    //console.log('zoomXY', zoomX, zoomY)

    let newX = 0;
    let newY = 0;
    let newW = 100;
    let newH = 100;

    if (zoomX < 1) {
      newW = zoomX * file.width
      newX = scroll.x * (file.width - newW)
    }
    else {
      // no scroll X => complete width is visible
      newX = 0;
      newW = file.width;
    }

    if (zoomY < 1) {
      newH = zoomY * file.height
      newY = scroll.y * (file.height - newH)

    }
    else {
      // no scroll y => complete height is visible
      newY = 0;
      newH = file.height;
    }

    //console.log(newX, newY, newW, newH)

    this.rect.x(newX)
    this.rect.y(newY)
    this.rect.width(newW)
    this.rect.height(newH)
  }
}
