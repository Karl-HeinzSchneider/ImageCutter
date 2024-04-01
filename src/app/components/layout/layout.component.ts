import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header/header.component';
import { LayersComponent } from '../layers/layers/layers.component';
import { AppRepository, ImageProps } from '../../state/cutter.store';
import { Observable } from 'rxjs';
import { MainComponent } from '../main/main.component';
import { DropImageComponent } from '../import/drop-image/drop-image.component';
import { TabbarComponent } from '../tabbar/tabbar/tabbar.component';
import { ToolbarComponent } from '../toolbar/toolbar/toolbar.component';
import { ToolsComponent } from '../tools/tools/tools.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, HeaderComponent, LayersComponent, MainComponent, DropImageComponent, TabbarComponent, ToolbarComponent, ToolsComponent],
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