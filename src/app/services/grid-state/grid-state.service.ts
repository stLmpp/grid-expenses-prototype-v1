import { ColumnState } from '@ag-grid-community/core';
import { inject, Injectable } from '@angular/core';
import { getEntity, upsertEntities } from '@ngneat/elf-entities';

import { GridStateModelFocusedCell, GridStateStore } from './grid-state.store';

@Injectable({ providedIn: 'root' })
export class GridStateService {
  private readonly _gridStateStore = inject(GridStateStore);

  upsertFilter(year: number, month: number, filter: Record<string, any> | null): void {
    this._gridStateStore.update(upsertEntities({ filter, year, month, id: `${year}-${month}` }));
  }

  upsertColumnsState(year: number, month: number, columnsState: ColumnState[]): void {
    this._gridStateStore.update(upsertEntities({ columnsState, month, year, id: `${year}-${month}` }));
  }

  upsertFocusedCell(year: number, month: number, focusedCell: GridStateModelFocusedCell | null): void {
    this._gridStateStore.update(upsertEntities({ year, month, id: `${year}-${month}`, focusedCell }));
  }

  addIfNotExists(year: number, month: number, columnState: ColumnState[]): void {
    const entity = this._gridStateStore.query(getEntity(`${year}-${month}`));
    if (entity) {
      return;
    }
    this.upsertColumnsState(year, month, columnState);
  }
}
