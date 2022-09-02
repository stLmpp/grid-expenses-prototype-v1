import { ColDef } from '@ag-grid-community/core';
import { formatNumber } from '@angular/common';
import { Inject, Injectable, LOCALE_ID } from '@angular/core';
import { addDays, format, isDate, isValid, parse } from 'date-fns';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { arrayUtil, isNumber, random } from 'st-utils';
import { v4 } from 'uuid';

import { CellEditorCurrencyComponent } from './cell-editor-currency/cell-editor-currency.component';
import { Expense } from './models/expense';
import { Month } from './models/month';

@Injectable({ providedIn: 'root' })
export class AppService {
  constructor(@Inject(LOCALE_ID) private readonly localeId: string) {}
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
      field: 'date',
      checkboxSelection: true,
      headerCheckboxSelection: true,
      rowDrag: true,
      editable: true,
      filter: 'agDateColumnFilter',
      width: 150,
      valueFormatter: (params) => {
        if (isDate(params.value)) {
          return format(params.value, 'dd/MM');
        }
        return params.value;
      },
      cellEditorParams: {
        useFormatter: true,
      },
      valueParser: (params) => {
        if (isDate(params.newValue)) {
          return params.newValue;
        }
        const parsed = parse(params.newValue, 'dd/MM', new Date());
        if (!isValid(parsed)) {
          return params.oldValue;
        }
        return parsed;
      },
    },
    { field: 'description', editable: true, flex: 1 },
  ]);

  readonly expenses$ = this._month$.pipe(map((month) => month.expenses));
  readonly colDefs$: Observable<ColDef<Expense>[]> = combineLatest([
    this._colDefs$,
    this._month$.pipe(map((data) => data.people)),
  ]).pipe(
    map(([colDefs, people]) => {
      const newColDefs: ColDef<Expense>[] = people.map((person) => ({
        field: person.id,
        headerName: person.name,
        editable: true,
        filter: 'agNumberColumnFilter',
        cellEditor: CellEditorCurrencyComponent,
        valueGetter: (params) => params.data!.people[person.id],
        valueSetter: (params) => {
          if (!params.newValue) {
            params.data.people[params.colDef.field!] = 0;
          } else {
            let valueParsed = parseFloat(params.newValue);
            if (Number.isNaN(valueParsed)) {
              valueParsed = 0;
            }
            params.data.people[params.colDef.field!] = valueParsed;
          }
          return true;
        },
        valueFormatter: (params) => {
          if (isNumber(params.value)) {
            return formatNumber(params.value, this.localeId, '1.2-2');
          }
          return params.value;
        },
      }));
      return [...colDefs, ...newColDefs];
    })
  );

  private _update(update: (data: Month) => Month): void {
    this._month$.next(update(this._month$.value));
  }

  private _setExpenses(expenses: Expense[]): void {
    this._update((data) => ({ ...data, expenses }));
  }

  private _updateExpenses(update: (data: Expense[]) => Expense[]): void {
    this._update((data) => ({ ...data, expenses: update(data.expenses) }));
  }

  generateRandomData(): void {
    this._update((data) => ({
      ...data,
      expenses: Array.from({ length: random(5, 25) }, (_, index) => ({
        id: v4(),
        description: `This is a descriptions ${index + 1}`,
        date: addDays(new Date(), index),
        people: data.people.reduce((acc, item) => ({ ...acc, [item.id]: 0 }), {}),
      })),
    }));
  }

  addBlankRowAt(index: number): void {
    this._updateExpenses((data) => arrayUtil(data, 'id').insert(this.getBlankRow(), index).toArray());
  }

  getBlankRow(): Expense {
    const snapshot = this._month$.value;
    return {
      id: v4(),
      description: '',
      date: new Date(),
      people: snapshot.people.reduce((acc, item) => ({ ...acc, [item.id]: 0 }), {}),
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
}
