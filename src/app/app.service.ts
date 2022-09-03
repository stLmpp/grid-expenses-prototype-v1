import { ColDef } from '@ag-grid-community/core';
import { formatNumber } from '@angular/common';
import { inject, Injectable, LOCALE_ID } from '@angular/core';
import { addDays, format, isDate } from 'date-fns';
import { BehaviorSubject, combineLatest, map, Observable, Subject } from 'rxjs';
import { arrayUtil, isNumber, random } from 'st-utils';
import { v4 } from 'uuid';

import { requiredValidation } from './ag-grid-validations';
import { CellEditorCurrencyComponent } from './cell-editor-currency/cell-editor-currency.component';
import { CellEditorDateComponent } from './cell-editor-date/cell-editor-date.component';
import { HeaderPersonComponent, HeaderPersonParams } from './header-person/header-person.component';
import { Expense } from './models/expense';
import { Month } from './models/month';

@Injectable({ providedIn: 'root' })
export class AppService {
  private readonly _localeId = inject(LOCALE_ID);

  private readonly _month$ = new BehaviorSubject<Month>({
    month: new Date().getMonth() + 1,
    expenses: [],
    people: [
      { id: v4(), name: 'Karina' },
      { id: v4(), name: 'Guilherme' },
    ],
  });
  private readonly _colDefs$ = new BehaviorSubject<ColDef<Expense>[]>([
    {
      field: '$__rowDrag__$',
      headerName: '',
      rowDrag: true,
      width: 40,
      filter: false,
    },
    {
      field: '$__selected__$',
      headerName: '',
      checkboxSelection: true,
      headerCheckboxSelection: true,
      width: 40,
      filter: false,
    },
    {
      field: 'date',
      editable: true,
      filter: 'agDateColumnFilter',
      headerName: 'Data',
      width: 150,
      cellEditor: CellEditorDateComponent,
      ...requiredValidation,
      valueFormatter: (params) => {
        if (isDate(params.value)) {
          return format(params.value, 'dd/MM');
        }
        return params.value;
      },
    },
    { field: 'description', editable: true, width: 400, headerName: 'Descrição', ...requiredValidation },
  ]);

  readonly expenses$ = this._month$.pipe(map((month) => month.expenses));
  readonly colDefs$: Observable<ColDef<Expense>[]> = combineLatest([
    this._colDefs$,
    this._month$.pipe(map((data) => data.people)),
  ]).pipe(
    map(([colDefs, people]) => {
      const newColDefs: ColDef<Expense>[] = people.map((person) => {
        const headerPersonParams: HeaderPersonParams = {
          person,
          newPerson$: new Subject(),
          deletePerson$: new Subject(),
        };
        return {
          field: person.id,
          headerName: person.name,
          filter: 'agNumberColumnFilter',
          cellEditor: CellEditorCurrencyComponent,
          headerComponent: HeaderPersonComponent,
          headerComponentParams: headerPersonParams,
          width: 150,
          editable: (params) => !params.node.isRowPinned(),
          valueGetter: (params) => params.data!.people[person.id],
          valueSetter: (params) => {
            params.data.people[params.colDef.field!] = params.newValue;
            return true;
          },
          valueFormatter: (params) => {
            if (isNumber(params.value)) {
              return formatNumber(params.value, this._localeId, '1.2-2');
            }
            return params.value;
          },
        };
      });
      return [...colDefs, ...newColDefs];
    })
  );

  readonly people$ = this._month$.pipe(map((month) => month.people));

  private _update(update: (data: Month) => Month): void {
    this._month$.next(update(this._month$.value));
  }

  private _updateExpenses(update: (data: Expense[]) => Expense[]): void {
    this._update((data) => ({ ...data, expenses: update(data.expenses) }));
  }

  generateRandomData(): void {
    this._update((data) => ({
      ...data,
      expenses: Array.from({ length: random(5, 150) }, (_, index) => ({
        ...this.getBlankRow(),
        description: `This is a descriptions ${index + 1}`,
        date: addDays(new Date(), index),
      })),
    }));
  }

  addBlankRowAt(index: number): void {
    this._updateExpenses((data) => arrayUtil(data, 'id').insert(this.getBlankRow(), index).toArray());
  }

  getBlankRow(): Expense {
    return {
      id: v4(),
      description: '',
      date: new Date(),
      people: {},
    };
  }

  addBlankRow(): void {
    this._updateExpenses((data) => arrayUtil(data, 'id').append(this.getBlankRow()).toArray());
  }

  addRow(row: Expense): void {
    this._updateExpenses((data) => arrayUtil(data, 'id').append(row).toArray());
  }

  deleteRow(id: string): void {
    this._updateExpenses((data) => arrayUtil(data, 'id').remove(id).toArray());
  }

  deleteRows(ids: string[]): void {
    this._updateExpenses((data) => arrayUtil(data, 'id').remove(ids).toArray());
  }

  updateRow(id: string, partial: Partial<Expense>): void {
    this._updateExpenses((data) => arrayUtil(data, 'id').update(id, partial).toArray());
  }

  move(indexFrom: number, indexTo: number): void {
    this._updateExpenses((data) => arrayUtil(data, 'id').move(indexFrom, indexTo).toArray());
  }

  addBlankPersonAt(index: number): void {
    this._update((month) => ({
      ...month,
      people: arrayUtil(month.people, 'id').insert({ id: v4(), name: '' }, index).toArray(),
    }));
  }

  updatePersonName(id: string, name: string): void {
    this._update((month) => ({ ...month, people: arrayUtil(month.people, 'id').update(id, { name }).toArray() }));
  }

  deletePerson(id: string): void {
    this._update((month) => ({ ...month, people: arrayUtil(month.people, 'id').remove(id).toArray() }));
  }
}
