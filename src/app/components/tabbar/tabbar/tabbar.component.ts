import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabsComponent } from '../tabs/tabs.component';
import { AppRepository, ImageProps } from '../../../state/cutter.store';
import { BehaviorSubject, Observable, combineLatest, distinctUntilChanged, map, shareReplay } from 'rxjs';

export interface tabArrays {
  tabs: ImageProps[],
  overflow: ImageProps[]
}
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


  private maxTabs: BehaviorSubject<number> = new BehaviorSubject(4);
  public maxTabs$ = this.maxTabs.pipe(distinctUntilChanged(), shareReplay());

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.updateSize()
  }

  tabs$: Observable<tabArrays>;

  showContext: boolean = false;


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

    this.updateSize();

    this.tabs$ = combineLatest([this.imagesOpen$, this.maxTabs$, this.activeID$]).pipe(map(([images, maxTabs, activeID]) => {

      let tabs: ImageProps[] = [];
      let overflow: ImageProps[] = []

      const tabsToShow = maxTabs - 1;

      if (tabsToShow < 1 || activeID === '-1') {
        overflow = images;
        //console.log(tabs, overflow);
        return { tabs: tabs, overflow: overflow }
      }

      tabs = images.slice(0, tabsToShow);
      overflow = images.slice(tabsToShow);

      //check if active images is in there
      const active = tabs.find(x => x.id === activeID);

      if (!active) {
        const realActive = overflow.find(x => x.id === activeID)!;

        const pop = tabs.pop()!;
        tabs.push(realActive);

        const overflowWithoutActive = overflow.filter(x => x.id != activeID);

        overflow = [pop, ...overflowWithoutActive];
      }

      //console.log(images, maxTabs, activeID);
      //console.log(tabs, overflow);

      return { tabs: tabs, overflow: overflow }
    }))
  }

  onClick() {
    this.store.setActiveImage('-1')
  }

  updateSize() {
    const innerW = window.innerWidth

    const space = innerW - 48 - 240;

    //console.log('tabbarSpace:', space);

    // fixed min tabsize = 64px
    const minSize = 128;

    const tabs = Math.floor(space / minSize);

    //console.log('tabs', tabs);

    this.maxTabs.next(tabs);

  }

  onClickContext(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    this.showContext = !this.showContext;
  }

  onMouseLeave() {
    this.showContext = false;
  }

  onSelect(e: Event, img: ImageProps) {
    e.preventDefault();
    e.stopPropagation();
    console.log('onSelect', img);

    this.store.setActiveImage(img.id);
  }
}
