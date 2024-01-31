import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TooltipModule } from '../../modules/tooltip/tooltip.module';

@Component({
  selector: 'app-layer-box',
  standalone: true,
  imports: [CommonModule, TooltipModule],
  templateUrl: './layer-box.component.html',
  styleUrl: './layer-box.component.scss'
})
export class LayerBoxComponent {
  @Input() headerText!: string;
}
