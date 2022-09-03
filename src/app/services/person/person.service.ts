import { inject, Injectable } from '@angular/core';
import { deleteEntities, updateEntities } from '@ngneat/elf-entities';
import { arrayUtil } from 'st-utils';
import { v4 } from 'uuid';

import { mapEntities } from '../../shared/store/map-entities';
import { ExpenseStore } from '../expense/expense.store';

@Injectable({ providedIn: 'root' })
export class PersonService {
  private readonly _expenseStore = inject(ExpenseStore);

  addBlankAt(index: number): void {
    this._expenseStore.update(
      mapEntities(
        (people) =>
          arrayUtil(people, 'id')
            .insert(
              {
                id: v4(),
                name: '',
              },
              index
            )
            .toArray(),
        { ref: this._expenseStore.personEntitiesRef }
      )
    );
  }

  updateName(id: string, name: string): void {
    this._expenseStore.update(updateEntities(id, { name }, { ref: this._expenseStore.personEntitiesRef }));
  }

  delete(id: string): void {
    this._expenseStore.update(deleteEntities(id, { ref: this._expenseStore.personEntitiesRef }));
  }
}
