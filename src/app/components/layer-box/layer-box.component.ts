import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipDirective } from '../../modules/tooltip/tooltip/tooltip.directive';

@Component({
  selector: 'app-layer-box',
  standalone: true,
  imports: [CommonModule, TooltipDirective],
  templateUrl: './layer-box.component.html',
  styleUrl: './layer-box.component.scss'
})
export class LayerBoxComponent {
  @Input() headerText!: string;
}
