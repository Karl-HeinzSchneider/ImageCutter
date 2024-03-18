import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolbarCutsComponent } from '../toolbar-cuts/toolbar-cuts.component';
import { AppRepository, ImageProps, tool } from '../../../state/cutter.store';
import { Observable } from 'rxjs';
import { ToolbarSelectComponent } from '../toolbar-select/toolbar-select.component';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [CommonModule, ToolbarCutsComponent, ToolbarSelectComponent],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss'
})
export class ToolbarComponent {

  active$: Observable<ImageProps | undefined>
  tool$: Observable<tool>;

  constructor(private store: AppRepository) {
    this.active$ = store.active$;
    this.tool$ = store.tool$;
  }
}
