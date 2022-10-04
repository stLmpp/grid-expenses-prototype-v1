import { ColDef } from '@ag-grid-community/core';
import { formatNumber } from '@angular/common';
import { inject, Injectable, LOCALE_ID } from '@angular/core';
import { selectAllEntities, selectAllEntitiesApply } from '@ngneat/elf-entities';
import { map, Observable, Subject } from 'rxjs';
import { isNumber, normalizeString, orderBy } from 'st-utils';
import { compareTwoStrings } from 'string-similarity';

import { CellEditorCurrencyComponent } from '../../ag-grid/cell-editor-currency/cell-editor-currency.component';
import { AgGridClassesEnum } from '../../ag-grid/classes.enum';
import { HeaderPersonComponent, HeaderPersonParams } from '../../ag-grid/header-person/header-person.component';
import { Expense } from '../../models/expense';
import { TextDistance } from '../../models/text-distance';
import { defaultCellClassRules } from '../../month/default-cell-class-rules';
import { getDefaultColDefs } from '../../month/get-default-col-defs';
import { getInstallmentsFromDescription } from '../../shared/utils/get-installments-from-description';

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
          cellClassRules: {
            ...defaultCellClassRules,
          },
          cellClass: (params) => {
            const classes = [AgGridClassesEnum.PersonValue];
            if (params.node.isRowPinned()) {
              classes.push(AgGridClassesEnum.NotEditable);
            }
            return classes;
          },
          editable: (params) => !params.node.isRowPinned(),
          valueGetter: (params) => params.data!.people[person.id],
          valueSetter: (params) => {
            const changed = params.data.people[params.colDef.field!] !== params.newValue;
            if (changed) {
              params.data.people[params.colDef.field!] = params.newValue;
            }
            return changed;
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
        mapEntity: (entity) => ({ ...entity, date: new Date(entity.date), people: { ...entity.people } }),
      }),
      map((expenses) =>
        [...expenses].sort((valueA, valueB) => {
          if (valueA.otherCard !== valueB.otherCard) {
            return +valueB.otherCard - +valueA.otherCard;
          }
          if (valueA.otherCard && valueB.otherCard) {
            return +valueA.date - +valueB.date;
          }
          if (valueA.installmentId && !valueB.installmentId) {
            if (valueA.isFirstInstallment) {
              return 0;
            }
            return -1;
          }
          if (!valueB.installmentId && valueB.installmentId) {
            return 1;
          }
          if (valueA.installmentId && valueB.installment && !valueA.isFirstInstallment && !valueB.isFirstInstallment) {
            return +valueA.date - +valueB.date;
          }
          return 0;
        })
      )
    );
  }

  selectSimilarExpenses(term: string): Observable<TextDistance[]> {
    const termNormalized = normalizeString(term).toLowerCase();
    return this._expenseStore.pipe(
      selectAllEntities(),
      map((entities) => {
        const uniqDescription = new Set<string>();
        const descriptions: TextDistance[] = [];
        for (const entity of entities) {
          const { descriptionWithoutInstallment } = getInstallmentsFromDescription(entity.description) ?? {
            descriptionWithoutInstallment: entity.description,
          };
          if (uniqDescription.has(descriptionWithoutInstallment)) {
            continue;
          }
          const descriptionNormalized = normalizeString(descriptionWithoutInstallment).toLowerCase();
          const distance = compareTwoStrings(descriptionNormalized, termNormalized);
          let includeDescription = distance >= 0.5;
          if (includeDescription && term.length < 5) {
            const includes = descriptionNormalized.toLowerCase().includes(termNormalized);
            includeDescription ||= includes;
          }
          if (includeDescription) {
            descriptions.push({ distance, text: descriptionWithoutInstallment });
          }
          uniqDescription.add(descriptionWithoutInstallment);
          if (descriptions.length === 20) {
            break;
          }
        }
        return orderBy(descriptions, 'distance', 'desc');
      })
    );
  }
}
