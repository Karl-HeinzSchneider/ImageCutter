import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayerBoxComponent } from '../layer-box/layer-box.component';
import { LayersCutComponent } from '../layers-cut/layers-cut.component';

@Component({
  selector: 'app-layers-cuts',
  standalone: true,
  imports: [CommonModule, LayerBoxComponent, LayersCutComponent],
  templateUrl: './layers-cuts.component.html',
  styleUrl: './layers-cuts.component.scss'
})
export class LayersCutsComponent {

  constructor() { }

  adderClicked() {
    console.log('Adder')
  }

  removerClicked() {
    console.log('Remover')
  }
}
