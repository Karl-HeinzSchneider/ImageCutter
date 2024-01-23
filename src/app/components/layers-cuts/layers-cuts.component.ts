import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayerBoxComponent } from '../layer-box/layer-box.component';
import { LayersCutComponent } from '../layers-cut/layers-cut.component';
import { AppRepository, ImageProps } from '../../state/cutter.store';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-layers-cuts',
  standalone: true,
  imports: [CommonModule, LayerBoxComponent, LayersCutComponent],
  templateUrl: './layers-cuts.component.html',
  styleUrl: './layers-cuts.component.scss'
})
export class LayersCutsComponent {

  @Input() active!: ImageProps;

  constructor(private store: AppRepository) {
  }

  adderClicked() {
    console.log('Adder', this.active)
    this.store.addNewCut(this.active.id)
  }

  removerClicked() {
    console.log('Remover', this.active)

    const selected = this.active.cuts?.find(x => x.selected)

    if (this.active.cuts && selected) {
      this.store.removeCut(this.active.id, selected.id)
    }
  }
}
