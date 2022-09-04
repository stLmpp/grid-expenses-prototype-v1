import { ColumnState } from '@ag-grid-community/core';
import { Injectable } from '@angular/core';
import { createStore } from '@ngneat/elf';
import { entitiesPropsFactory, withEntities } from '@ngneat/elf-entities';
import { v4 } from 'uuid';

import { Expense } from '../../models/expense';
import { Person } from '../../models/person';
import { createStoreProviders } from '../../shared/store/create-store-providers';

const { withPersonEntities, personEntitiesRef } = entitiesPropsFactory('person');
const { withGridStateEntities, gridStateEntitiesRef } = entitiesPropsFactory('gridState');

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

const store = createStore(
  {
    name: 'expense',
  },
  withEntities<Expense>(),
  withPersonEntities<Person>({
    initialValue: [
      { id: v4(), name: 'Karina' },
      { id: v4(), name: 'Guilherme' },
    ],
  }),
  withGridStateEntities<GridStateModel>()
);

const { Base, useFactory } = createStoreProviders(store, { personEntitiesRef, gridStateEntitiesRef });

@Injectable({ providedIn: 'root', useFactory })
export class ExpenseStore extends Base {}
