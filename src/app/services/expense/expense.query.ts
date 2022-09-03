import { ColDef } from '@ag-grid-community/core';
import { formatNumber } from '@angular/common';
import { inject, Injectable, LOCALE_ID } from '@angular/core';
import { selectAllEntities, selectAllEntitiesApply } from '@ngneat/elf-entities';
import { combineLatest, map, Observable, Subject } from 'rxjs';
import { isNumber } from 'st-utils';

import { CellEditorCurrencyComponent } from '../../cell-editor-currency/cell-editor-currency.component';
import { HeaderPersonComponent, HeaderPersonParams } from '../../header-person/header-person.component';
import { Expense } from '../../models/expense';
import { getDefaultColDefs } from '../../month/get-default-col-defs';

import { ExpenseStore } from './expense.store';

@Injectable({ providedIn: 'root' })
export class ExpenseQuery {
  private readonly _expenseStore = inject(ExpenseStore);
  private readonly _localeId = inject(LOCALE_ID);

  private readonly _defaultColDefs = getDefaultColDefs();

  readonly people$ = this._expenseStore.pipe(
    selectAllEntities({
      ref: this._expenseStore.personEntitiesRef,
    })
  );

  readonly colDefs$: Observable<ColDef<Expense>[]> = this.people$.pipe(
    map((people) => {
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
      return [...this._defaultColDefs, ...newColDefs];
    })
  );

  selectMonth(year: number, month: number): Observable<Expense[]> {
    return this._expenseStore.pipe(
      selectAllEntitiesApply({
        filterEntity: (entity) => entity.year === year && entity.month === month,
      })
    );
  }
}