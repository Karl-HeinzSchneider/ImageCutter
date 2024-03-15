import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CanvasInfoComponent } from './canvas-info.component';

describe('CanvasInfoComponent', () => {
  let component: CanvasInfoComponent;
  let fixture: ComponentFixture<CanvasInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CanvasInfoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CanvasInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
