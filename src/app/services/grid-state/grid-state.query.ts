import { inject, Injectable } from '@angular/core';
import { selectEntity } from '@ngneat/elf-entities';
import { map, Observable } from 'rxjs';

import { distinctUntilKeysChanged } from '../../shared/operators/distinct-until-keys-changed';

import { GridStateModel, GridStateStore } from './grid-state.store';

@Injectable({ providedIn: 'root' })
export class GridStateQuery {
  private readonly _gridStateStore = inject(GridStateStore);

  selectState(
    year: number,
    month: number
  ): Observable<Pick<GridStateModel, 'columnsState' | 'filter' | 'focusedCell'>> {
    return this._gridStateStore.pipe(
      selectEntity(`${year}-${month}`),
      map((gridState) => ({
        columnsState: gridState?.columnsState,
        filter: gridState?.filter,
        focusedCell: gridState?.focusedCell,
      })),
      distinctUntilKeysChanged(['columnsState', 'filter', 'focusedCell'])
    );
  }
}
