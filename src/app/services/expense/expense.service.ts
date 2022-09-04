import { inject, Injectable } from '@angular/core';
import { OrArray } from '@ngneat/elf';
import { addEntities, deleteEntities, setEntities, updateEntities } from '@ngneat/elf-entities';
import { addDays } from 'date-fns';
import { arrayUtil, random } from 'st-utils';
import { v4 } from 'uuid';

import { Expense } from '../../models/expense';
import { mapEntities } from '../../shared/store/map-entities';

import { ExpenseStore } from './expense.store';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly _expenseStore = inject(ExpenseStore);

  update(id: string, partial: Partial<Expense>): void {
    this._expenseStore.update(updateEntities(id, partial));
  }

  generateRandomData(year: number, month: number, qty?: number): void {
    const newEntities: Expense[] = Array.from({ length: qty ?? random(5, 25) }, (_, index) => ({
      ...this.getBlankRow(year, month),
      description: `This is a descriptions ${index + 1}`,
      date: addDays(new Date(year, month - 1), index),
    }));
    this._expenseStore.update(addEntities(newEntities));
  }

  generateRandomDataMultipleMonths(): void {
    const year = new Date().getFullYear();
    const newEntities: Expense[] = Array.from(
      {
        length: random(150, 500),
      },
      (_, index) => {
        const y = random(year - 1, year + 1);
        const m = random(1, 12);
        return {
          ...this.getBlankRow(y, m),
          description: `This is a descriptions ${index + 1}`,
          date: addDays(new Date(y, m - 1), index),
        };
      }
    );
    this._expenseStore.update(setEntities(newEntities));
  }

  getBlankRow(year: number, month: number): Expense {
    return {
      id: v4(),
      description: '',
      date: new Date(year, month - 1),
      people: {},
      month,
      year,
    };
  }

  move(year: number, month: number, idFrom: string, idTo: string): void {
    this._expenseStore.update(
      mapEntities((expenses) => {
        const fromIndex = expenses.findIndex((expense) => expense.id === idFrom);
        const toIndex = expenses.findIndex((expense) => expense.id === idTo);
        if (fromIndex === -1 || toIndex === -1) {
          return expenses;
        }
        return arrayUtil(expenses, 'id').move(fromIndex, toIndex).toArray();
      })
    );
  }

  delete(year: number, month: number, idOrIds: OrArray<string>): void {
    this._expenseStore.update(deleteEntities(idOrIds));
  }

  add(expense: Expense): void {
    this._expenseStore.update(addEntities(expense));
  }

  addBlankAt(year: number, month: number, index: number): void {
    this._expenseStore.update(
      mapEntities((expenses) => {
        const expensesMonth = expenses.filter((expense) => expense.year === year && expense.month === month);
        const id = expensesMonth[index]?.id;
        const newItem = this.getBlankRow(year, month);
        if (!id) {
          return [...expenses, newItem];
        }
        const realIndex = expenses.findIndex((expense) => expense.id === id);
        return arrayUtil(expenses, 'id').insert(newItem, realIndex).toArray();
      })
    );
  }

  undo(): void {
    this._expenseStore.history.undo();
  }

  redo(): void {
    this._expenseStore.history.redo();
  }
}
