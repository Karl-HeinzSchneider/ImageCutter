import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppRepository, ImageProps } from '../../state/cutter.store';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.scss'
})
export class TabsComponent {

  @Input() image!: ImageProps;
  @Input() selected: boolean = true;


  constructor(private store: AppRepository) {
  }

  onClick() {
    if (this.selected) {
    }
    else {
      this.store.setActiveImage(this.image.id)
    }
  }

  onClose(e: Event) {
    e.preventDefault()
    e.stopPropagation()
    console.log('close', this.image.meta.name)

    this.store.closeImage(this.image.id)
  }
}
