import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CellEditorCurrencyComponent } from './cell-editor-currency.component';

describe('CellEditorCurrencyComponent', () => {
  let component: CellEditorCurrencyComponent;
  let fixture: ComponentFixture<CellEditorCurrencyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CellEditorCurrencyComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CellEditorCurrencyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
