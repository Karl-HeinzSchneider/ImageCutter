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

  inputChange(e: Event, varName: string, cut: ImageCut) {
    return;
    const tar = e.target as HTMLInputElement
    const value = Number(tar.value)
    const tarID = tar.id;

    console.log('inputChange', e, tar, tarID, value)

    this.changeStoreValues(tarID, cut, value)
  }

  input(e: Event, varName: string, cut: ImageCut) {
    const tar = e.target as HTMLInputElement
    const tarID = tar.id;

    // enforce min/max values
    const value = Math.min(Number(tar.max), Math.max(Number(tar.min), Number(tar.value)))

    console.log('input', e, varName, cut, value)

    this.changeStoreValues(tarID, cut, value)
    tar.value = String(value)
  }

  private changeStoreValues(tarID: string, cut: ImageCut, value: number) {
    let newCut = { ...cut }

    switch (tarID) {
      case 'posX': {
        // this.store.updateSelectedCut(this.active.id, { absolute: {x: value} })
        newCut.absolute.x = value
        break;
      }
      case 'posY': {
        newCut.absolute.y = value
        break;
      }

      case 'sizeX': {
        newCut.absolute.width = value
        break;
      }

      case 'sizeY': {
        newCut.absolute.height = value
        break;
      }

      default:
        return;
    }

    this.store.updateCut(this.active.id, newCut)
  }
}
