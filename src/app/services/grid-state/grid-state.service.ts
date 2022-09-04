import { ColumnState } from '@ag-grid-community/core';
import { inject, Injectable } from '@angular/core';
import { getEntity, upsertEntities } from '@ngneat/elf-entities';

import { ExpenseStore, GridStateModelFocusedCell } from '../expense/expense.store';

@Injectable({ providedIn: 'root' })
export class GridStateService {
  private readonly _expenseStore = inject(ExpenseStore);

  upsertFilter(year: number, month: number, filter: Record<string, any> | null): void {
    this._expenseStore.update(
      upsertEntities({ filter, year, month, id: `${year}-${month}` }, { ref: this._expenseStore.gridStateEntitiesRef })
    );
  }

  upsertColumnsState(year: number, month: number, columnsState: ColumnState[]): void {
    this._expenseStore.update(
      upsertEntities(
        { columnsState, month, year, id: `${year}-${month}` },
        { ref: this._expenseStore.gridStateEntitiesRef }
      )
    );
  }

  upsertFocusedCell(year: number, month: number, focusedCell: GridStateModelFocusedCell | null): void {
    this._expenseStore.update(
      upsertEntities(
        { year, month, id: `${year}-${month}`, focusedCell },
        { ref: this._expenseStore.gridStateEntitiesRef }
      )
    );
  }

  addIfNotExists(year: number, month: number, columnState: ColumnState[]): void {
    const entity = this._expenseStore.query(
      getEntity(`${year}-${month}`, { ref: this._expenseStore.gridStateEntitiesRef })
    );
    if (entity) {
      return;
    }
    this.upsertColumnsState(year, month, columnState);
  }
}
