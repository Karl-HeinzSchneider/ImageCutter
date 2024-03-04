import { Component, Input, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { AppRepository, ImageProps } from '../../../state/cutter.store';
import { TooltipModule } from '../../../modules/tooltip/tooltip.module';
import { CommonModule } from '@angular/common';

@Pipe({ name: 'dateDelta', standalone: true })
export class dataDeltaPipe implements PipeTransform {

  transform(date: Date) {
    const now = new Date()

    const delta = now.valueOf() - date.valueOf()
    const deltaDays = Math.floor(delta / (1000 * 60 * 60 * 24))

    if (deltaDays === 0) {
      return '< 1 day ago'
    }
    else if (deltaDays === 1) {

    }

    switch (deltaDays) {
      case 0: return '< 1 day ago';
      case 1: return '1 day ago';
      default: return `${deltaDays} days ago`;
    }
  }
}

@Component({
  selector: 'app-history-icon',
  standalone: true,
  imports: [CommonModule, dataDeltaPipe, TooltipModule],
  templateUrl: './history-icon.component.html',
  styleUrl: './history-icon.component.scss'
})
export class HistoryIconComponent implements OnDestroy {

  @Input() image!: ImageProps;

  showContext: boolean = false;
  markedForDeletion: boolean = false;

  constructor(private store: AppRepository) {
  }

  ngOnDestroy(): void {
    //console.log('ngOnDestroy', this.image.meta.name);
  }

  markForDeletion(mark: boolean) {

  }

  onClick(e: Event) {
    console.log('click', this.image.meta.name);
    this.store.setActiveImage(this.image.id);
  }

  onClickClose(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    console.log('close', this.image.meta.name);
    if (this.image.meta.active) {
      // set inactive
      this.store.closeImage(this.image.id);
    }
    else {
      // mark delete
      this.markForDeletion(true);
    }
  }

  onClickMenu(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    console.log('menu', this.image.meta.name);
    this.showContext = !this.showContext;
  }

  onMouseLeave() {
    this.showContext = false;
  }

  stopClick(e: Event) {
    e.preventDefault();
    e.stopPropagation();
  }

  onClickSelect(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    this.store.setActiveImage(this.image.id);
  }

  onClickSetActive(e: Event, active: boolean) {
    e.preventDefault();
    e.stopPropagation();

    if (active) {
      this.store.openImage(this.image.id);
    }
    else {
      this.store.closeImage(this.image.id);
    }
  }

  onClickDownload(e: Event) {
    e.preventDefault();
    e.stopPropagation();
  }

  onClickDelete(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    this.markForDeletion(true);
  }

  onClickDuplicate(e: Event) {
    e.preventDefault();
    e.stopPropagation();
  }
}
