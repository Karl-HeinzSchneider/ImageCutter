import { Component, OnInit } from '@angular/core';
import { TooltipPosition } from './tooltip.directive';

@Component({
  selector: 'app-tooltip',
  standalone: false,
  templateUrl: './tooltip.component.html',
  styleUrl: './tooltip.component.scss'
})
export class TooltipComponent implements OnInit {

  tooltip: string = '';
  left: number = 0;
  top: number = 0;
  position: string = TooltipPosition.DEFAULT;

  constructor() { }

  ngOnInit(): void { }

}
