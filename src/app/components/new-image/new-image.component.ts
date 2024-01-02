import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageFile } from '../../state/cutter.store';

@Component({
  selector: 'app-new-image',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './new-image.component.html',
  styleUrl: './new-image.component.scss'
})
export class NewImageComponent {

  constructor() { }


  async onDrop(event: DragEvent) {
    event.preventDefault()

    //console.log(event)  

    if (event.dataTransfer?.files) {
      const files: FileList = event.dataTransfer.files;

      for (let i = 0; i < files.length; i++) {
        const file: File = files[i]

        if (!file.type.startsWith('image/')) {
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
  }

  onDragOver(event: any) {
    event.stopPropagation();
    event.preventDefault()

    console.log('dragover')
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
}
