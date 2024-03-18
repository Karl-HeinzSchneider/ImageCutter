import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AppRepository, tool } from '../../../state/cutter.store';
import { Observable } from 'rxjs';
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

  constructor(private store: AppRepository) {
    this.tool$ = store.tool$;
  }

  public toolClicked(tool: tool) {
    this.store.updateTool(tool);
  }
}
