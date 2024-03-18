import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-toolbar-input-text',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './toolbar-input-text.component.html',
  styleUrl: './toolbar-input-text.component.scss'
})
export class ToolbarInputTextComponent {
  inputHover: boolean = false;

  @Input() name: string = '*NAME*'


  @Input() value: string = '*PLACEHOLDER*'
  @Output() valueChange = new EventEmitter<string>;

  constructor() {
  }

  onChange(e: Event) {
    //console.log('onChange', e);

    const tar = e.target as HTMLInputElement;
    const newValue = tar.value;

    if (newValue === '') {
      tar.value = this.value;
    }
    else {
      this.value = newValue;
      this.valueChange.emit(newValue);
    }
  }

  onHover(e: boolean) {
    this.inputHover = e;
  }
}
