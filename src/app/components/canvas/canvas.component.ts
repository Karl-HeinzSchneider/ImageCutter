import { AfterViewInit, Component, ElementRef, HostListener, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppRepository, ImageFile, ImageProps } from '../../state/cutter.store';
import Konva from 'konva';
import { Stage } from 'konva/lib/Stage';
import { Layer } from 'konva/lib/Layer';
import { Vector2d } from 'konva/lib/types';


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
    this.centerStageBG()
  }

  constructor(private store: AppRepository) {
  }

  async ngAfterViewInit(): Promise<void> {
    //console.log('ngAfterViewInit')
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

      Konva.Image.fromURL(image.dataURL, function (node) {
        node.setAttrs({
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          id: 'bg'
        })

        layerBG.add(node)
      })

      this.centerStageBG()
    }
    else {
      //console.log('drawStageBG - same image')
    }
  }

  private centerStageBG() {
    const image: ImageFile = this.image.file!;
    const center = this.getStageCenter()

    this.layerBG.offsetX(image.width / 2)
    this.layerBG.offsetY(image.height / 2)
    this.layerBG.position(center)
  }

  private getStageCenter() {
    const x = this.stage.width() / 2
    const y = this.stage.height() / 2

    return { x: x, y: y } as Vector2d
  }

  private updateScale() {
    const scale = this.image.meta.zoom

    this.layerBG.scaleX(scale)
    this.layerBG.scaleY(scale)

    const padding = 24

    const image: ImageFile = this.image.file!;

    const width = image.width * scale + 2 * padding
    const height = image.height * scale + 2 * padding

    if (this.largeRef) {
      const large: HTMLDivElement = this.largeRef.nativeElement;
      large.style.width = `${width}px`
      large.style.height = `${height}px`
    }

    if (this.scrollRef) {
      const scroll: HTMLDivElement = this.scrollRef.nativeElement
      //scrollElement.scrollLeft =  (scrollElement.scrollWidth - scrollElement.clientWidth ) / 2;   
      scroll.scrollLeft = (scroll.scrollWidth - scroll.clientWidth) * this.image.meta.scrollX
      scroll.scrollTop = (scroll.scrollHeight - scroll.clientHeight) * this.image.meta.scrollY
    }

  }

  public onScroll(event: Event) {
    //console.log(event)

    const scroll: HTMLDivElement = this.scrollRef.nativeElement

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
}
