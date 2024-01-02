import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { LayersComponent } from '../layers/layers.component';
import { AppRepository, ImageProps } from '../../state/cutter.store';
import { Observable } from 'rxjs';
import { MainComponent } from '../main/main.component';
import { DropImageComponent } from '../drop-image/drop-image.component';
import { TabbarComponent } from '../tabbar/tabbar.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, HeaderComponent, LayersComponent, MainComponent, DropImageComponent, TabbarComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
  showDropzone$: Observable<boolean>;

  active$: Observable<ImageProps | undefined>;

  constructor(private store: AppRepository) {
    this.showDropzone$ = store.showDropzone$;
    this.active$ = store.active$;
  }

  onDrop(event: DragEvent) {
    event.preventDefault()
    //console.log('onDropss')
  }

  onDragOver(event: DragEvent) {
    event.stopPropagation();
    event.preventDefault()
    //console.log('dragoverssss')

    if (!this.store.store.getValue().showDropzone) {
      this.store.updateShowDropzone(true)
    }
  }

  onDragLeave(event: DragEvent) {
    //console.log('onDragLeavessss')
  }

}