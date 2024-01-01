import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-layer-box',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './layer-box.component.html',
  styleUrl: './layer-box.component.scss'
})
export class LayerBoxComponent {
  @Input() headerText!: string;
}
