import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { AppRepository, ImageCut, ImageProps } from '../../state/cutter.store';

@Component({
  selector: 'app-toolbar-cuts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toolbar-cuts.component.html',
  styleUrl: './toolbar-cuts.component.scss'
})
export class ToolbarCutsComponent {

  @Input() active!: ImageProps;

  selectedCut$: Observable<ImageCut | undefined>

  constructor(private store: AppRepository) {
    this.selectedCut$ = store.selectedCut$;
  }
}
