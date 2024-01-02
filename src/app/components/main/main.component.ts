import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { AppRepository, ImageProps } from '../../state/cutter.store';
import { NewImageComponent } from '../new-image/new-image.component';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, NewImageComponent],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {
  active$: Observable<ImageProps | undefined>;

  constructor(private store: AppRepository) {
    this.active$ = store.active$
  }

}
