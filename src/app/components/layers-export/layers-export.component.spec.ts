import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayersExportComponent } from './layers-export.component';

describe('LayersExportComponent', () => {
  let component: LayersExportComponent;
  let fixture: ComponentFixture<LayersExportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayersExportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LayersExportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
