import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Input, OnChanges, Pipe, PipeTransform, SimpleChanges, ViewChild } from '@angular/core';
import { AppRepository, CanvasProps, ImageCut } from '../../../state/cutter.store';
import { TooltipModule } from '../../../modules/tooltip/tooltip.module';

@Pipe({ name: 'cutSize', standalone: true })
export class cutSizePipe implements PipeTransform {
  transform(value: ImageCut, ...args: any[]): string {

    if (value.type === 'absolute' && value.absolute) {
      return `w: ${value.absolute.width}, h: ${value.absolute.height}`
    }

    return '';
  }
}
@Component({
  selector: 'app-layers-cut',
  standalone: true,
  imports: [CommonModule, cutSizePipe, TooltipModule],
  templateUrl: './layers-cut.component.html',
  styleUrl: './layers-cut.component.scss'
})
export class LayersCutComponent implements OnChanges, AfterViewInit {
  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef;

  @Input() cut!: ImageCut;
  @Input() activeCanvas!: CanvasProps;

  constructor(private store: AppRepository) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    //console.log('ngOnChanges', this.cut.name, changes)

    this.drawCut()
  }

  ngAfterViewInit(): void {
    //console.log('ngAfterViewInit', this.cut.name)
    this.drawCut()
  }

  drawCut() {
    if (!this.canvasRef) {
      return;
    }
    //console.log('drawCut')

    const canvas = this.canvasRef.nativeElement as HTMLCanvasElement
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.imageSmoothingEnabled = false;

    //ctx.drawImage(this.imageRef, 0, 0, this.active.file?.width!, this.active.file?.height!)

    //ctx.drawImage(this.imageRef, 0, 0, 184, 184, 0, 0, 40, 40);

    const activeCanvas = this.activeCanvas.canvas

    if (this.cut.type === 'absolute') {
      const abs = this.cut.absolute
      const sx = abs.x;
      const sy = abs.y;
      const sWidth = abs.width;
      const sHeight = abs.height;

      if (sWidth === sHeight) {
        //console.log('sWidth === sHeight')
        const dx = 0;
        const dy = 0;
        const dWidth = 40;
        const dHeight = 40;
        ctx.drawImage(activeCanvas, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
      }
      else if (sWidth > sHeight) {
        //console.log('sWidth > sHeight')
        const dx = 0;
        const dWidth = 40;

        const dHeight = (sHeight / sWidth) * 40;
        const dy = (40 - dHeight) / 2;

        ctx.drawImage(activeCanvas, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
      }
      else {
        //console.log('sWidth < sHeight')
        const dWidth = (sWidth / sHeight) * 40;
        const dx = (40 - dWidth) / 2;

        const dHeight = 40
        const dy = 0

        ctx.drawImage(activeCanvas, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
      }
    }
    else if (this.cut.type === 'relative') {

    }


    //ctx.fillRect(0, 0, 184, 184)
  }

  cutClicked() {
    //console.log('cut clicked', this.activeCanvas.id, this.cut.name)

    if (!this.cut.selected) {
      //console.log('Select Cut', this.id, this.cut)
      this.store.selectCut(this.activeCanvas.id, this.cut)
    }
    else {
      //console.log('already selected', this.id, this.cut)
      this.store.selectCut(this.activeCanvas.id, undefined)
    }
  }

  eyeClicked() {
    //console.log('toggle eye', this.activeCanvas.id, this.cut)
    let newCut: ImageCut = { ...this.cut }
    newCut.visible = !this.cut.visible

    this.store.updateCut(this.activeCanvas.id, newCut)
  }

  mouseover(over: boolean) {
    //console.log('mouseover', this.cut.name, over)
    const id = over ? this.cut.id : ''
    this.store.updateMouseoverCutID(id)
  }
}
