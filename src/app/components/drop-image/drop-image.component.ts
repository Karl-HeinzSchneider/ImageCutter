import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppRepository, ImageFile } from '../../state/cutter.store';

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

      for (let i = 0; i < files.length; i++) {
        const file: File = files[i]

        if (!this.validFileType(file)) {
          continue;
        }

        let im: ImageFile = {
          lastModified: file.lastModified,
          lastModifiedDate: new Date(file.lastModified),
          name: file.name,
          size: file.size,
          type: file.type,
          dataURL: ''
        }

        const dataURL = await this.readFileAsDataUr(file);
        im.dataURL = dataURL

        //console.log(file)
        console.log(im)
      }
    }

    this.store.updateShowDropzone(false)
  }

  // https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types
  private fileTypes = [
    "image/apng",
    "image/bmp",
    "image/gif",
    "image/jpeg",
    "image/pjpeg",
    "image/png",
    "image/svg+xml",
    "image/tiff",
    "image/webp",
    "image/x-icon",
  ];

  validFileType(file: File) {
    return this.fileTypes.includes(file.type);
  }

  async readFileAsDataUr(file: File): Promise<string> {
    // console.log(file)
    let result = new Promise<string>((resolve) => {
      let reader = new FileReader()

      reader.onloadend = (e) => {
        const res: string = reader.result as string;
        resolve(res)
      }

      reader.readAsDataURL(file)
    })

    return result
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


