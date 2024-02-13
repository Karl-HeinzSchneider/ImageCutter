import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolbarCutsComponent } from './toolbar-cuts.component';

describe('ToolbarCutsComponent', () => {
  let component: ToolbarCutsComponent;
  let fixture: ComponentFixture<ToolbarCutsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolbarCutsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ToolbarCutsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
