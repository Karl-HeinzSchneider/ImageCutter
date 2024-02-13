import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppRepository, ImageFile } from '../../../state/cutter.store';

@Component({
  selector: 'app-drop-image',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './drop-image.component.html',
  styleUrl: './drop-image.component.scss'
})
export class DropImageComponent {

  constructor(private store: AppRepository) {
  }

  async onDrop(event: DragEvent) {
    event.preventDefault()

    console.log('onDrop')

    if (event.dataTransfer?.files) {
      const files: FileList = event.dataTransfer.files;

      this.store.openFileList(files)
    }

    this.store.updateShowDropzone(false)
  }

  onDragOver(event: DragEvent) {
    event.stopPropagation();
    event.preventDefault()

    //console.log('dragover')

    if (!this.store.store.getValue().showDropzone) {
      this.store.updateShowDropzone(true)
    }
  }

  onDragLeave(event: DragEvent) {
    //console.log('onDragLeave')
    this.store.updateShowDropzone(false)
  }
}


