import { Component, Input, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { AppRepository, ImageProps } from '../../../state/cutter.store';
import { TooltipModule } from '../../../modules/tooltip/tooltip.module';
import { CommonModule } from '@angular/common';
import { Observable, Subject, interval, startWith, take, takeUntil, timer } from 'rxjs';

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
  private readonly destroy$ = new Subject<number>()

  @Input() image!: ImageProps;

  showContext: boolean = false;

  markedForDeletion: boolean = false;
  deletionSecondsLeft: number = 42;
  private readonly deletionTimeSeconds: number = 9;
  deletionTimer: Observable<number> = interval(1000).pipe(take(this.deletionTimeSeconds), startWith(-1), takeUntil(this.destroy$))

  constructor(private store: AppRepository) {
  }

  ngOnDestroy(): void {
    //console.log('ngOnDestroy', this.image.meta.name);
    this.destroy$.next(1)
    this.destroy$.complete()

    if (this.markedForDeletion) {
      this.deleteImage();
    }
  }

  markForDeletion(mark: boolean) {
    if (mark) {
      this.markedForDeletion = true;
      this.destroy$.next(1);

      this.deletionTimer.subscribe(num => {
        // deletionTimeSeconds = 10 -> 10,9,8,...,0
        const timeLeft = this.deletionTimeSeconds - 1 - num
        //console.log('timer', num, timeLeft);
        this.deletionSecondsLeft = timeLeft;

        if (timeLeft === 0) {
          this.deleteImage();
        }
      })
    }
    else {
      this.markedForDeletion = false;
      this.destroy$.next(1);
    }
  }

  deleteImage() {
    console.log('DELETE', this.image.meta.name);
    this.store.deleteImage(this.image.id)
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
    this.store.duplicateImage(this.image.id);
  }

  onClickUndo(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    this.markForDeletion(false);
  }

  onClickDeleteAtOnce(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    this.deleteImage();
  }
}
