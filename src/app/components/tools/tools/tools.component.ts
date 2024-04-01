import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AppRepository, ImageProps, tool } from '../../../state/cutter.store';
import { Observable, combineLatest, map } from 'rxjs';
import { TooltipModule } from '../../../modules/tooltip/tooltip.module';

@Component({
  selector: 'app-tools',
  standalone: true,
  imports: [CommonModule, TooltipModule],
  templateUrl: './tools.component.html',
  styleUrl: './tools.component.scss'
})
export class ToolsComponent {

  active$: Observable<ImageProps | undefined>;

  constructor(private store: AppRepository) {
    this.active$ = store.active$;
  }

  public toolClicked(id: string, tool: tool) {
    console.log('toolClicked', tool);
    //this.store.updateTool(tool);
    this.store.selectCut(id, undefined);
  }
}
