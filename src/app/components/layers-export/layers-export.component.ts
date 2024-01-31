import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayerBoxComponent } from '../layer-box/layer-box.component';
import { AppRepository, CanvasProps, ImageProps } from '../../state/cutter.store';
import { TooltipModule } from '../../modules/tooltip/tooltip.module';
import { Observable } from 'rxjs';
import { ExporterComponent } from '../exporter/exporter.component';

@Component({
  selector: 'app-layers-export',
  standalone: true,
  imports: [CommonModule, LayerBoxComponent, TooltipModule, ExporterComponent],
  templateUrl: './layers-export.component.html',
  styleUrl: './layers-export.component.scss'
})
export class LayersExportComponent {
  @ViewChild('exporter') exporterRef!: ExporterComponent;

  public active$: Observable<ImageProps | undefined>;
  public activeCanvas$: Observable<CanvasProps>;

  constructor(private store: AppRepository) {
    this.active$ = store.active$;
    this.activeCanvas$ = store.activeCanvas$;
  }

  onClickSelected() {
    //console.log('onClickSelected')
    this.exporterRef.downloadSelectedCut()
  }

  onClickAll() {
    //console.log('onClickAll')
    this.exporterRef.downloadAllCuts()
  }
}
