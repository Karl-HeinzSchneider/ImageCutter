import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AppRepository, tool } from '../../../state/cutter.store';
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

  tool$: Observable<tool>;
  moveActive$: Observable<boolean>;

  constructor(private store: AppRepository) {
    this.tool$ = store.tool$;

    this.moveActive$ = combineLatest([this.store.active$, this.store.selectedCut$]).pipe(
      map(([active, selectedCut]) => {
        if (!active || !selectedCut) {
          return false;
        }
        return true;
      })
    )
  }

  public toolClicked(tool: tool) {
    this.store.updateTool(tool);
  }
}
