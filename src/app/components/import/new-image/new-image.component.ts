import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppRepository, ImageFile, ImageProps } from '../../../state/cutter.store';
import { HistoryIconComponent } from '../history-icon/history-icon.component';
import { Observable } from 'rxjs';
import { deleteEntitiesByPredicate } from '@ngneat/elf-entities';

@Component({
  selector: 'app-new-image',
  standalone: true,
  imports: [CommonModule, HistoryIconComponent],
  templateUrl: './new-image.component.html',
  styleUrl: './new-image.component.scss'
})
export class NewImageComponent {

  imagesOpen$: Observable<ImageProps[]>;
  imagesClosed$: Observable<ImageProps[]>;


  constructor(private store: AppRepository) {
    this.imagesOpen$ = store.imagesOpen$;
    this.imagesClosed$ = store.imagesClosed$;
  }


  async onDrop(event: DragEvent) {
    event.preventDefault()

    //console.log(event)  

    if (event.dataTransfer?.files) {
      const files: FileList = event.dataTransfer.files;

      this.store.openFileList(files)
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

  onChange(event: Event) {
    console.log(event)

    const target = event.target as HTMLInputElement;
    const files = target.files as FileList;
    //console.log(files)

    this.store.openFileList(files)
  }
}
