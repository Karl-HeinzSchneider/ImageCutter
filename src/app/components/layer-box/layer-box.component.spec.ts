import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayerBoxComponent } from './layer-box.component';

describe('LayerBoxComponent', () => {
  let component: LayerBoxComponent;
  let fixture: ComponentFixture<LayerBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayerBoxComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LayerBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
