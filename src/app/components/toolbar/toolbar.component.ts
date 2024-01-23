import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolbarCutsComponent } from '../toolbar-cuts/toolbar-cuts.component';
import { AppRepository, ImageProps } from '../../state/cutter.store';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule, ToolbarCutsComponent],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss'
})
export class ToolbarComponent {

  active$: Observable<ImageProps | undefined>

  constructor(private store: AppRepository) {
    this.active$ = store.active$;
  }
}
