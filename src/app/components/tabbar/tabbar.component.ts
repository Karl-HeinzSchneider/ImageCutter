import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsComponent } from '../tabs/tabs.component';
import { AppRepository, ImageProps } from '../../state/cutter.store';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-tabbar',
  standalone: true,
  imports: [CommonModule, TabsComponent],
  templateUrl: './tabbar.component.html',
  styleUrl: './tabbar.component.scss'
})
export class TabbarComponent {

  active$: Observable<ImageProps | undefined>;
  activeID$: Observable<string>;
  imagesOpen$: Observable<ImageProps[]>;

  constructor(private store: AppRepository) {
    this.active$ = store.active$;
    this.imagesOpen$ = store.imagesOpen$;

    this.activeID$ = store.active$.pipe(map(prop => {
      if (prop) {
        return prop.id
      }
      else {
        return '-1'
      }
    }))
  }

  onClick() {
    this.store.setActiveImage('-1')
  }
}
