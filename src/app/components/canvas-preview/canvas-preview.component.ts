import { AfterViewInit, Component, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Stage } from 'konva/lib/Stage';
import { Layer } from 'konva/lib/Layer';
import Konva from 'konva';
import { Subject, takeUntil } from 'rxjs';
import { AppRepository, ImageFile } from '../../state/cutter.store';
import { getActiveEntity } from '@ngneat/elf-entities';
import { Rect } from 'konva/lib/shapes/Rect';

@Component({
  selector: 'app-canvas-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canvas-preview.component.html',
  styleUrl: './canvas-preview.component.scss'
})
export class CanvasPreviewComponent implements AfterViewInit, OnChanges, OnDestroy {
  private readonly destroy$ = new Subject<number>()

  private stage!: Stage;
  private layerBG!: Layer;
  private layerRect!: Layer;

  private rect!: Rect;


  private id: string = '-42';
  private imageFile: ImageFile | undefined;


  constructor(private store: AppRepository) {
  }

  ngOnChanges(changes: SimpleChanges): void {

  }

  ngAfterViewInit(): void {
    if (!this.stage) {
      this.initStage()
      this.initSubs()
      this.initRect()
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
      console.log('file changed', f)
      this.imageFile = f;

      // #hack, need id for store update...
      const q = this.store.store.query(getActiveEntity())
      if (q) {
        this.id = q.id
      }

      this.drawBG()

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

    rect.on('dragmove', function () {
      const imageW = componentRef.imageFile?.width || 0
      const imageH = componentRef.imageFile?.height || 0

      const newX = Math.max(0, Math.min(this.x(), imageW - this.width()))
      const newY = Math.max(0, Math.min(this.y(), imageH - this.height()))


      this.x(newX)
      this.y(newY)
    })

    this.rect = rect
    this.layerRect.add(rect)
  }


  private updateRect() {

  }
}
