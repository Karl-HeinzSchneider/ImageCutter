import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { AppRepository, ImageCut, ImageProps, imageCutZod } from '../../../state/cutter.store';
import { convertAbsoluteToRelative, convertRelativeToAbsolute } from '../../../state/global.helper';
import { Vector2d } from 'konva/lib/types';
import { TooltipModule } from '../../../modules/tooltip/tooltip.module';
import { Clipboard, ClipboardModule } from '@angular/cdk/clipboard'
import { ImageCutResult, ImageCutterResult } from '../../layers/exporter/exporter.component';

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

  private worker: Worker;


  constructor(private store: AppRepository, private clipboard: Clipboard) {
    this.selectedCut$ = store.selectedCut$;
    this.worker = new Worker(new URL('../../../worker/image-cutter.worker', import.meta.url))

    this.handleWorker()
  }

  private handleWorker() {
    this.worker.addEventListener('message', ({ data }) => {
      console.log('Worker finished', data)

      const cutterResult: ImageCutterResult = data
      //console.log(data);
      if (cutterResult.result[0]) {
        const result: ImageCutResult = cutterResult.result[0];
        const dataURL = result.dataURL;
        //window.open(dataURL)
        //console.log('result url:', dataURL);

        const newTab = window.open();
        if (newTab) {
          const cut = result.cut;

          const doc = newTab.document;
          const head = doc.head;
          const newBody = doc.body;

          newBody.style.margin = '0';

          doc.title = `ImageCutter: ${cut.name} | w:${cut.absolute.width} h:${cut.absolute.height} | id: ${cut.id}`;

          const newHTML = `
          <div  style="
            align-items: center;
            display: flex;
            justify-content: center;
            height: 100%;
            width: 100%;
            background-color: #171719;
          ">
            <div  style="
              display: flex;
              flex-direction: column;
              gap: 4px;
            ">
              <img src="${dataURL}" width="${cut.absolute.width}px" height="${cut.absolute.height}px" style="margin: auto;">
              <a 
              style="color: #00A5A5; margin-left: auto"
              href=${dataURL} download="${cut.name}.png">download</a>
            </div>
          </div>
          `

          newBody.innerHTML = newHTML
        }
      }
    })
  }

  openCutInNewTab(cut: ImageCut) {
    this.worker.postMessage({
      active: this.active,
      cuts: [cut],
      options: {}
    })
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

  removerClicked() {
    if (!this.active) {
      return;
    }
    console.log('Remover', this.active)

    const selected = this.active.cuts?.find(x => x.selected)

    if (this.active.cuts && selected) {
      this.store.removeCut(this.active.id, selected.id)
    }
  }

  duplicateClicked() {
    if (this.active) {
      console.log('Duplicate')

      const selected = this.active.cuts?.find(x => x.selected)

      if (this.active.cuts && selected) {
        this.store.duplicateCut(this.active.id, selected.id)
      }
    }
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
