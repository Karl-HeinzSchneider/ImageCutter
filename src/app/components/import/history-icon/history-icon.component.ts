import { Component, Input, Pipe, PipeTransform } from '@angular/core';
import { ImageProps } from '../../../state/cutter.store';
import { TooltipModule } from '../../../modules/tooltip/tooltip.module';

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
  imports: [dataDeltaPipe, TooltipModule],
  templateUrl: './history-icon.component.html',
  styleUrl: './history-icon.component.scss'
})
export class HistoryIconComponent {

  @Input() image!: ImageProps;

  constructor() {
  }
}
