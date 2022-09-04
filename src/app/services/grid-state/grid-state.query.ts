import { inject, Injectable } from '@angular/core';
import { selectEntity } from '@ngneat/elf-entities';
import { map, Observable } from 'rxjs';

import { ExpenseStore, GridStateModel } from '../expense/expense.store';

@Injectable({ providedIn: 'root' })
export class GridStateQuery {
  private readonly _expensesStore = inject(ExpenseStore);

  selectState(
    year: number,
    month: number
  ): Observable<Pick<GridStateModel, 'columnsState' | 'filter' | 'focusedCell'>> {
    return this._expensesStore.pipe(
      selectEntity(`${year}-${month}`, { ref: this._expensesStore.gridStateEntitiesRef }),
      map((gridState) => ({
        columnsState: gridState?.columnsState,
        filter: gridState?.filter,
        focusedCell: gridState?.focusedCell,
      }))
    );
  }
}
