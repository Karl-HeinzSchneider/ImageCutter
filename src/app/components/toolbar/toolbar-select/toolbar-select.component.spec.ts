import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolbarSelectComponent } from './toolbar-select.component';

describe('ToolbarSelectComponent', () => {
  let component: ToolbarSelectComponent;
  let fixture: ComponentFixture<ToolbarSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolbarSelectComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ToolbarSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
