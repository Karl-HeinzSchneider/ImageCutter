import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { AppRepository, ImageCut, ImageProps, imageCutZod } from '../../../state/cutter.store';
import { convertAbsoluteToRelative, convertRelativeToAbsolute } from '../../../state/global.helper';
import { Vector2d } from 'konva/lib/types';
import { TooltipModule } from '../../../modules/tooltip/tooltip.module';
import { Clipboard, ClipboardModule } from '@angular/cdk/clipboard'

@Component({
  selector: 'app-toolbar-cuts',
  standalone: true,
  imports: [CommonModule, TooltipModule, ClipboardModule],
  templateUrl: './toolbar-cuts.component.html',
  styleUrl: './toolbar-cuts.component.scss'
})
export class ToolbarCutsComponent {

  @Input() active!: ImageProps;

  nameInputHover: boolean = false;

  selectedCut$: Observable<ImageCut | undefined>

  constructor(private store: AppRepository, private clipboard: Clipboard) {
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

    //console.log('input', e, varName, cut, value)

    this.changeStoreValues(tarID, cut, value)
    tar.value = String(value)
  }

  onNameChange(e: Event, cut: ImageCut) {
    //console.log('onNameChange', e)

    const tar = e.target as HTMLInputElement;
    const newName = tar.value;

    if (newName === '') {
      tar.value = cut.name;
    }
    else {
      let newCut: ImageCut = JSON.parse(JSON.stringify(cut))
      newCut.name = newName;

      this.store.updateCut(this.active.id, newCut)
    }
  }

  onHover(e: boolean) {
    this.nameInputHover = e;
  }

  private changeStoreValues(tarID: string, cut: ImageCut, value: number) {
    let newCut = { ...cut }

    const imgSize: Vector2d = { x: this.active.file.width, y: this.active.file.height };

    switch (tarID) {
      case 'posX': {
        // this.store.updateSelectedCut(this.active.id, { absolute: {x: value} })
        newCut.absolute.x = value
        newCut.relative = convertAbsoluteToRelative(newCut.absolute, imgSize)
        break;
      }
      case 'posY': {
        newCut.absolute.y = value
        newCut.relative = convertAbsoluteToRelative(newCut.absolute, imgSize)
        break;
      }

      case 'sizeX': {
        newCut.absolute.width = value
        newCut.relative = convertAbsoluteToRelative(newCut.absolute, imgSize)
        break;
      }

      case 'sizeY': {
        newCut.absolute.height = value
        newCut.relative = convertAbsoluteToRelative(newCut.absolute, imgSize)
        break;
      }

      case 'top': {
        newCut.relative.top = value
        newCut.absolute = convertRelativeToAbsolute(newCut.relative, imgSize)
        break;
      }

      case 'bottom': {
        newCut.relative.bottom = value
        newCut.absolute = convertRelativeToAbsolute(newCut.relative, imgSize)
        break;
      }

      case 'left': {
        newCut.relative.left = value
        newCut.absolute = convertRelativeToAbsolute(newCut.relative, imgSize)
        break;
      }

      case 'right': {
        newCut.relative.right = value
        newCut.absolute = convertRelativeToAbsolute(newCut.relative, imgSize)
        break;
      }

      default:
        return;
    }

    this.store.updateCut(this.active.id, newCut)
  }

  public setAbsolute(abs: boolean, cut: ImageCut) {
    let newCut = { ...cut }

    newCut.type = abs ? 'absolute' : 'relative';

    this.store.updateCut(this.active.id, newCut)
  }

  public stringifyCut(cut: ImageCut): string {
    return JSON.stringify(cut);
  }

  public async paste(e: Event) {
    //console.log('pasteEvent', e);

    window.navigator.clipboard.readText().then(str => {
      //console.log('paste', str);

      const strJson = JSON.parse(str);
      const parsed = imageCutZod.safeParse(strJson)

      if (parsed.success) {
        console.log('parse success!');
      }
      else {
        console.error('Paste from Clipboard Error', parsed.error);
      }

    }).catch(error => {
      console.error(error);
    });
  }

  test(cut: ImageCut) {

  }
}
