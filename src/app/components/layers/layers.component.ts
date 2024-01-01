import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayerBoxComponent } from '../layer-box/layer-box.component';

@Component({
  selector: 'app-layers',
  standalone: true,
  imports: [CommonModule, LayerBoxComponent],
  templateUrl: './layers.component.html',
  styleUrl: './layers.component.scss'
})
export class LayersComponent {

}
