import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayersCutsComponent } from './layers-cuts.component';

describe('LayersCutsComponent', () => {
  let component: LayersCutsComponent;
  let fixture: ComponentFixture<LayersCutsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayersCutsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LayersCutsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
