import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CanvasNavigationComponent } from './canvas-navigation.component';

describe('CanvasNavigationComponent', () => {
  let component: CanvasNavigationComponent;
  let fixture: ComponentFixture<CanvasNavigationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CanvasNavigationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CanvasNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
