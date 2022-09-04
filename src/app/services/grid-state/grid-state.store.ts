import { ColumnState } from '@ag-grid-community/core';
import { Injectable } from '@angular/core';
import { createStore } from '@ngneat/elf';
import { withEntities } from '@ngneat/elf-entities';

import { createStoreProviders } from '../../shared/store/create-store-providers';

export interface GridStateModelFocusedCell {
  rowIndex: number;
  colId: string;
}

export interface GridStateModel {
  id: string;
  year: number;
  month: number;
  filter?: Record<string, any> | null;
  columnsState?: ColumnState[];
  focusedCell?: GridStateModelFocusedCell | null;
}

const store = createStore({
  name: 'grid-state',
}, withEntities<GridStateModel>())

const { Base, useFactory } = createStoreProviders(store);

@Injectable({ providedIn: 'root', useFactory })
export class GridStateStore extends Base {}
