import { ICellEditorAngularComp } from '@ag-grid-community/angular';
import { ICellEditorParams } from '@ag-grid-community/core';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  TrackByFunction,
  ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, Observable, of, switchMap } from 'rxjs';

import { TextDistance } from '../../models/text-distance';
import { ExpenseQuery } from '../../services/expense/expense.query';

@Component({
  selector: 'app-cell-editor-autocomplete',
  templateUrl: './cell-editor-autocomplete.component.html',
  styleUrls: ['./cell-editor-autocomplete.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CellEditorAutocompleteComponent implements ICellEditorAngularComp, AfterViewInit {
  private readonly _expenseQuery = inject(ExpenseQuery);

  @ViewChild('input') readonly inputElement!: ElementRef<HTMLInputElement>;

  readonly control = new FormControl('', { nonNullable: true });

  readonly similarExpenses$: Observable<TextDistance[]> = this.control.valueChanges.pipe(
    debounceTime(300),
    switchMap((term) => {
      if (term.length < 2) {
        return of([]);
      }
      return this._expenseQuery.selectSimilarExpenses(term);
    })
  );

  trackByIndex: TrackByFunction<TextDistance> = (index) => index;

  agInit(params: ICellEditorParams): void {
    this.control.setValue(params.value ?? '');
  }

  getValue(): string {
    return this.control.value;
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.inputElement.nativeElement.focus();
      this.inputElement.nativeElement.classList.toggle('mat-autocomplete-trigger');
      this.inputElement.nativeElement.classList.toggle('mat-autocomplete-trigger');
    });
  }
}
