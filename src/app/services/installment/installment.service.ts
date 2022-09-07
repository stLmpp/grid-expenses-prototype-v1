import { inject, Injectable } from '@angular/core';
import {
  addEntities,
  deleteEntitiesByPredicate,
  updateEntities,
  updateEntitiesByPredicate,
} from '@ngneat/elf-entities';
import { addMonths } from 'date-fns';
import { v4 } from 'uuid';

import { Expense, ExpenseInstallment } from '../../models/expense';
import { ExpenseStore } from '../expense/expense.store';

import { isExpenseInstallment } from './is-expense-installment';

@Injectable({ providedIn: 'root' })
export class InstallmentService {
  private readonly _expenseStore = inject(ExpenseStore);

  /**
   * @description Delete all future installments and update the description of the current
   */
  deleteAllInstallments({ id, description, installmentId }: ExpenseInstallment): void {
    return this._expenseStore.update(
      deleteEntitiesByPredicate(
        (expense) =>
          isExpenseInstallment(expense) && expense.installmentId === installmentId && !expense.isFirstInstallment
      ),
      updateEntities(id, {
        description,
        installmentId: null,
        installment: null,
        installmentQuantity: null,
        isFirstInstallment: null,
      })
    );
  }

  /**
   * @description Handle the situation where the installment quantity is lower than the current installment quantity
   * Example: If we change from 1/6 to 1/4
   */
  installmentQuantityLower(
    { installmentId }: ExpenseInstallment,
    newInstallmentQuantity: number,
    descriptionWithoutInstallments: string
  ): void {
    return this._expenseStore.update(
      // Delete entities that are no longer part of the installments
      deleteEntitiesByPredicate(
        (expense) =>
          isExpenseInstallment(expense) &&
          expense.installmentId === installmentId &&
          expense.installment > newInstallmentQuantity
      ),
      // Update all descriptions
      updateEntitiesByPredicate(
        (expense) => isExpenseInstallment(expense) && expense.installmentId === installmentId,
        (expense) => ({
          ...expense,
          description: `${descriptionWithoutInstallments}${expense.installment}/${newInstallmentQuantity}`,
          installmentQuantity: newInstallmentQuantity,
        })
      )
    );
  }

  /**
   * @description Handle the situation where the installment quantity is higher than the current installment quantity
   * Example: If we change from 1/4 to 1/6
   */
  installmentQuantityHigher(
    { installmentQuantity: oldInstallmentQuantity, people, date, installmentId }: ExpenseInstallment,
    newInstallmentQuantity: number,
    year: number,
    month: number,
    descriptionWithoutInstallments: string
  ): void {
    const newEntities: Expense[] = [];
    // Loop from the old installment quantity to the new installment quantity
    for (let index = oldInstallmentQuantity; index < newInstallmentQuantity; index++) {
      const nextDate = addMonths(new Date(year, month - 1), index);
      newEntities.push({
        month: nextDate.getMonth() + 1,
        year: nextDate.getFullYear(),
        description: `${descriptionWithoutInstallments}${index + 1}/${newInstallmentQuantity}`,
        id: v4(),
        people,
        date,
        installmentId,
        installment: index + 1,
        installmentQuantity: newInstallmentQuantity,
        isFirstInstallment: false,
        order: 0,
      });
    }
    return this._expenseStore.update(
      // Add new entities
      addEntities(newEntities),
      // Update old entities with new description (if any)
      updateEntitiesByPredicate(
        (expense) =>
          isExpenseInstallment(expense) &&
          expense.installmentId === installmentId &&
          expense.installment < newInstallmentQuantity,
        (expense) => ({
          ...expense,
          description: `${descriptionWithoutInstallments}${expense.installment}/${newInstallmentQuantity}`,
          installmentQuantity: newInstallmentQuantity,
        })
      )
    );
  }

  /**
   * @description Update all the descriptions with the same installmentId
   */
  updateAllDescriptions(
    { installmentId }: ExpenseInstallment,
    descriptionWithoutInstallments: string,
    installmentQuantity: number
  ): void {
    return this._expenseStore.update(
      updateEntitiesByPredicate(
        (expense) => isExpenseInstallment(expense) && expense.installmentId === installmentId,
        (expense) => ({
          ...expense,
          description: `${descriptionWithoutInstallments}${expense.installment}/${installmentQuantity}`,
        })
      )
    );
  }

  addInstallments(
    installment: number,
    installmentQuantity: number,
    year: number,
    month: number,
    descriptionWithoutInstallments: string,
    expense: Expense
  ): void {
    const installmentId = v4();
    const newEntities: Expense[] = [];
    for (
      let installmentIndex = installment, index = 1;
      installmentIndex < installmentQuantity;
      installmentIndex++, index++
    ) {
      const nextDate = addMonths(new Date(year, month - 1), index);
      newEntities.push({
        month: nextDate.getMonth() + 1,
        year: nextDate.getFullYear(),
        description: `${descriptionWithoutInstallments}${installment + index}/${installmentQuantity}`,
        id: v4(),
        people: expense.people,
        date: expense.date,
        installmentId,
        installment: installment + index,
        installmentQuantity,
        isFirstInstallment: false,
        order: 0,
      });
    }
    this._expenseStore.update(
      updateEntities(expense.id, {
        description: expense.description,
        installmentId,
        installment,
        installmentQuantity,
        isFirstInstallment: true,
      }),
      addEntities(newEntities)
    );
  }
}
