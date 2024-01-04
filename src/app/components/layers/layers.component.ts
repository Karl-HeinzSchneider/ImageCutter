import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayerBoxComponent } from '../layer-box/layer-box.component';
import { CanvasNavigationComponent } from '../canvas-navigation/canvas-navigation.component';

@Component({
  selector: 'app-layers',
  standalone: true,
  imports: [CommonModule, LayerBoxComponent, CanvasNavigationComponent],
  templateUrl: './layers.component.html',
  styleUrl: './layers.component.scss'
})
export class LayersComponent {

}
