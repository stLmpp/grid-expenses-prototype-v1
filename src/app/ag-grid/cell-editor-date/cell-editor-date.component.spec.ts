import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CellEditorDateComponent } from './cell-editor-date.component';

describe('CellEditorDateComponent', () => {
  let component: CellEditorDateComponent;
  let fixture: ComponentFixture<CellEditorDateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CellEditorDateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CellEditorDateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
