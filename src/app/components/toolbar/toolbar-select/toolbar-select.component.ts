import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AppRepository, ImageProps } from '../../../state/cutter.store';
import { ToolbarInputTextComponent } from '../toolbar-input-text/toolbar-input-text.component';

@Component({
  selector: 'app-toolbar-select',
  standalone: true,
  imports: [CommonModule, ToolbarInputTextComponent],
  templateUrl: './toolbar-select.component.html',
  styleUrl: './toolbar-select.component.scss'
})
export class ToolbarSelectComponent {

  @Input() active!: ImageProps;

  constructor(private store: AppRepository) {

  }

  onNameChange(e: string) {
    console.log('onNameChange', e);
    this.store.updateName(this.active.id, e)
  }
}
