import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CellEditorAutocompleteComponent } from './cell-editor-autocomplete.component';

describe('CellEditorAutocompleteComponent', () => {
  let component: CellEditorAutocompleteComponent;
  let fixture: ComponentFixture<CellEditorAutocompleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CellEditorAutocompleteComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CellEditorAutocompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
