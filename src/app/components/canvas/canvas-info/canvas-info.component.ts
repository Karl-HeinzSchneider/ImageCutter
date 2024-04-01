import { Component } from '@angular/core';
import { AppRepository, ImageProps } from '../../../state/cutter.store';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { CanvasService } from '../canvas.service';
import { Vector2d } from 'konva/lib/types';

@Component({
  selector: 'app-canvas-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canvas-info.component.html',
  styleUrl: './canvas-info.component.scss'
})
export class CanvasInfoComponent {

  active$: Observable<ImageProps | undefined>;
  mouseoverCoords$: Observable<Vector2d | null>;

  constructor(private store: AppRepository, private canvasService: CanvasService) {
    this.active$ = store.active$;
    this.mouseoverCoords$ = canvasService.mouseoverCoords$;
  }
}
