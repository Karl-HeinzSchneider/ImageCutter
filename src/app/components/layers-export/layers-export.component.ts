import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayerBoxComponent } from '../layer-box/layer-box.component';

@Component({
  selector: 'app-layers-export',
  standalone: true,
  imports: [CommonModule, LayerBoxComponent],
  templateUrl: './layers-export.component.html',
  styleUrl: './layers-export.component.scss'
})
export class LayersExportComponent {

}
