import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToolbarInputTextComponent } from './toolbar-input-text.component';

describe('ToolbarInputTextComponent', () => {
  let component: ToolbarInputTextComponent;
  let fixture: ComponentFixture<ToolbarInputTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToolbarInputTextComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ToolbarInputTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
