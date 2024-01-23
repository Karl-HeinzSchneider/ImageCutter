import { Component, Input, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppRepository, ImageCut } from '../../state/cutter.store';

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
  imports: [CommonModule, cutSizePipe],
  templateUrl: './layers-cut.component.html',
  styleUrl: './layers-cut.component.scss'
})
export class LayersCutComponent {

  @Input() id!: string;
  @Input() cut!: ImageCut;

  constructor(private store: AppRepository) {
  }

  cutClicked() {
    //console.log('cut clicked', this.id, this.cut.name)

    if (!this.cut.selected) {
      //console.log('Select Cut', this.id, this.cut)
      this.store.selectCut(this.id, this.cut)
    }
    else {
      //console.log('already selected', this.id, this.cut)
    }
  }

  eyeClicked() {
    //console.log('toggle eye', this.id, this.cut)
    let newCut: ImageCut = { ...this.cut }
    newCut.visible = !this.cut.visible

    this.store.updateCut(this.id, newCut)
  }
}
