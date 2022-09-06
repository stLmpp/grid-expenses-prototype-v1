import { inject, Injectable } from '@angular/core';
import { OrArray } from '@ngneat/elf';
import {
  addEntities,
  deleteEntities,
  setEntities,
  updateEntities,
  updateEntitiesByPredicate,
} from '@ngneat/elf-entities';
import { addDays, isBefore } from 'date-fns';
import { arrayUtil, random } from 'st-utils';
import { v4 } from 'uuid';

import { Expense } from '../../models/expense';
import { mapEntities } from '../../shared/store/map-entities';
import { getInstallmentsFromDescription } from '../../shared/utils/get-installments-from-description';
import { InstallmentService } from '../installment/installment.service';
import { isExpenseInstallment } from '../installment/is-expense-installment';

import { ExpenseStore } from './expense.store';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly _expenseStore = inject(ExpenseStore);
  private readonly _installmentService = inject(InstallmentService);

  update(id: string, partial: Partial<Expense>): void {
    this._expenseStore.update(updateEntities(id, partial));
  }

  updateDescription(year: number, month: number, expense: Expense): void {
    // TODO delete future installments
    const installmentsInfo = getInstallmentsFromDescription(expense.description);
    if (!installmentsInfo) {
      // No installment was found on description
      if (isExpenseInstallment(expense)) {
        // Has previous installment in the expense
        // So we need to delete all future installments
        // And update the description
        return this._installmentService.deleteAllInstallments(expense);
      }
      // Just update the description
      return this.update(expense.id, expense);
    }
    const [installment, installmentQuantity, descriptionWithoutInstallments] = installmentsInfo;
    if (isExpenseInstallment(expense)) {
      // Expense already has installment configuration
      if (installmentQuantity < expense.installmentQuantity) {
        // Installment quantity is lower than the current installment quantity
        return this._installmentService.installmentQuantityLower(
          expense,
          installmentQuantity,
          descriptionWithoutInstallments
        );
      }
      // Installment quantity is higher than the current installment quantity
      if (installmentQuantity > expense.installmentQuantity) {
        return this._installmentService.installmentQuantityHigher(
          expense,
          installmentQuantity,
          year,
          month,
          descriptionWithoutInstallments
        );
      }
      // Installment quantity is equal, so we just need to update the description
      // of all installments
      return this._installmentService.updateAllDescriptions(
        expense,
        descriptionWithoutInstallments,
        installmentQuantity
      );
    }
    this._installmentService.addInstallments(
      installment,
      installmentQuantity,
      year,
      month,
      descriptionWithoutInstallments,
      expense
    );
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

  updatePersonValue(year: number, month: number, data: Expense): void {
    if (!data.installmentId) {
      return this.update(data.id, data);
    }
    const date = new Date(data.year, data.month);
    this._expenseStore.update(
      updateEntities(data.id, data),
      updateEntitiesByPredicate(
        (expense) =>
          expense.installmentId === data.installmentId && isBefore(date, new Date(expense.year, expense.month)),
        (expense) => ({ ...expense, people: { ...expense.people, ...data.people } })
      )
    );
  }
}
