import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayerBoxComponent } from '../layer-box/layer-box.component';
import { CanvasNavigationComponent } from '../canvas-navigation/canvas-navigation.component';
import { LayersCutComponent } from '../layers-cut/layers-cut.component';

@Component({
  selector: 'app-layers',
  standalone: true,
  imports: [CommonModule, LayerBoxComponent, CanvasNavigationComponent, LayersCutComponent],
  templateUrl: './layers.component.html',
  styleUrl: './layers.component.scss'
})
export class LayersComponent {

}
