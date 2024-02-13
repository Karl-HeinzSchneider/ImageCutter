import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayersCutComponent } from './layers-cut.component';

describe('LayersCutComponent', () => {
  let component: LayersCutComponent;
  let fixture: ComponentFixture<LayersCutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayersCutComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LayersCutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
