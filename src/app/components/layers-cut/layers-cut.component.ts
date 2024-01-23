import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppRepository, ImageCut } from '../../state/cutter.store';

@Component({
  selector: 'app-layers-cut',
  standalone: true,
  imports: [CommonModule],
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
      console.log('Select Cut', this.id, this.cut)
      this.store.selectCut(this.id, this.cut)
    }
    else {
      console.log('already selected', this.id, this.cut)
    }
  }

  eyeClicked() {
    console.log('toggle eye', this.id, this.cut)
    let newCut: ImageCut = { ...this.cut }
    newCut.visible = !this.cut.visible

    this.store.updateCut(this.id, newCut)
  }
}
