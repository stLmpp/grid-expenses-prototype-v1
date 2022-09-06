import { inject, Injectable } from '@angular/core';
import { OrArray, Reducer } from '@ngneat/elf';
import {
  addEntities,
  deleteEntities,
  deleteEntitiesByPredicate,
  getAllEntitiesApply,
  setEntities,
  updateEntities,
  updateEntitiesByPredicate,
} from '@ngneat/elf-entities';
import { addDays, addMonths, isBefore } from 'date-fns';
import { arrayUtil, random } from 'st-utils';
import { v4 } from 'uuid';

import { Expense } from '../../models/expense';
import { mapEntities } from '../../shared/store/map-entities';
import { getInstallmentsFromDescription } from '../../shared/utils/get-installments-from-description';

import { ExpenseStore } from './expense.store';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly _expenseStore = inject(ExpenseStore);

  update(id: string, partial: Partial<Expense>): void {
    this._expenseStore.update(updateEntities(id, partial));
  }

  updateDescription(year: number, month: number, expense: Expense): void {
    // TODO refactor this function to be smaller
    // TODO handle case where the installment number changed with isFirstInstallment
    // TODO delete item
    const installmentsInfo = getInstallmentsFromDescription(expense.description);
    if (!installmentsInfo) {
      if (expense.installmentId) {
        this._expenseStore.update(
          deleteEntitiesByPredicate(
            (_expense) => _expense.installmentId === expense.installmentId && !_expense.isFirstInstallment
          ),
          updateEntities(expense.id, {
            description: expense.description,
            installmentId: null,
            installment: null,
            installmentQuantity: null,
            isFirstInstallment: null,
          })
        );
        return;
      } else {
        return this.update(expense.id, expense);
      }
    }
    const [installment, installmentQuantity, descriptionWithoutInstallments] = installmentsInfo;
    if (expense.installmentId) {
      if (expense.installmentQuantity !== installmentQuantity) {
        if (installmentQuantity < expense.installmentQuantity!) {
          this._expenseStore.update(
            updateEntities(expense.id, { description: expense.description, installmentQuantity }),
            deleteEntitiesByPredicate(
              (_expense) =>
                !!_expense.installmentId &&
                _expense.installmentId === expense.installmentId &&
                _expense.installment! > installmentQuantity
            ),
            updateEntitiesByPredicate(
              (_expense) =>
                !!_expense.installmentId &&
                _expense.installmentId === expense.installmentId &&
                !_expense.isFirstInstallment,
              (_expense) => ({
                ..._expense,
                description: `${descriptionWithoutInstallments}${_expense.installment}/${installmentQuantity}`,
              })
            )
          );
        } else if (installmentQuantity > expense.installmentQuantity!) {
          const newEntities: Expense[] = [];
          for (let index = expense.installmentQuantity!; index < installmentQuantity; index++) {
            const nextDate = addMonths(new Date(year, month - 1), index);
            newEntities.push({
              month: nextDate.getMonth() + 1,
              year: nextDate.getFullYear(),
              description: `${descriptionWithoutInstallments}${installment + index}/${installmentQuantity}`,
              id: v4(),
              people: expense.people,
              date: expense.date,
              installmentId: expense.installmentId,
              installment: installment + index,
            });
          }
          this._expenseStore.update(
            updateEntities(expense.id, { description: expense.description, installmentQuantity }),
            addEntities(newEntities),
            updateEntitiesByPredicate(
              (_expense) =>
                !!_expense.installmentId &&
                _expense.installmentId === expense.installmentId &&
                !_expense.isFirstInstallment &&
                _expense.installment! < installmentQuantity,
              (_expense) => ({
                ..._expense,
                description: `${descriptionWithoutInstallments}${_expense.installment}/${installmentQuantity}`,
              })
            )
          );
        }
      } else if (installment !== expense.installment) {
        if (installment > expense.installment!) {
          const difference = installment - expense.installment!;
          this._expenseStore.update(
            updateEntities(expense.id, { description: expense.description, installment }),
            deleteEntitiesByPredicate(
              (_expense) =>
                !!_expense.installmentId &&
                _expense.installmentId === expense.installmentId &&
                !_expense.isFirstInstallment &&
                _expense.installment! + difference > installmentQuantity
            ),
            updateEntitiesByPredicate(
              (_expense) =>
                !!_expense.installmentId &&
                _expense.installmentId === expense.installmentId &&
                !_expense.isFirstInstallment &&
                _expense.installment! < installmentQuantity,
              (_expense) => ({
                ..._expense,
                description: `${descriptionWithoutInstallments}${
                  _expense.installment! + difference
                }/${installmentQuantity}`,
                installment: _expense.installment! + difference,
              })
            )
          );
        } else {
          const difference = expense.installment! - installment;
          const lastInstallment = arrayUtil(
            this._expenseStore.query(
              getAllEntitiesApply({
                filterEntity: (_expense) => _expense.installmentId === expense.installmentId,
              })
            ),
            'id'
          )
            .orderBy(['year', 'month'])
            .getLast()!;
          const newEntities: Expense[] = [];

          for (let index = installmentQuantity; index >= difference; index--) {
            const nextDate = addMonths(new Date(year, month - 1), index);
            newEntities.push({
              month: nextDate.getMonth() + 1,
              year: nextDate.getFullYear(),
              description: `${descriptionWithoutInstallments}${
                lastInstallment.installment! + (index - 1)
              }/${installmentQuantity}`,
              id: v4(),
              people: expense.people,
              date: expense.date,
              installmentId: expense.installmentId,
              installment: lastInstallment.installment! + (index - 1),
            });
          }
          this._expenseStore.update(
            updateEntities(expense.id, { description: expense.description, installment }),
            addEntities(newEntities)
          );
          // this._expenseStore.update(
          //   updateEntities(expense.id, { description: expense.description, installment }),
          //   deleteEntitiesByPredicate(
          //     (_expense) =>
          //       !!_expense.installmentId &&
          //       _expense.installmentId === expense.installmentId &&
          //       !_expense.isFirstInstallment &&
          //       _expense.installment! + difference > installmentQuantity
          //   ),
          //   updateEntitiesByPredicate(
          //     (_expense) =>
          //       !!_expense.installmentId &&
          //       _expense.installmentId === expense.installmentId &&
          //       !_expense.isFirstInstallment &&
          //       _expense.installment! < installmentQuantity,
          //     (_expense) => ({
          //       ..._expense,
          //       description: `${descriptionWithoutInstallments}${
          //         _expense.installment! + difference
          //       }/${installmentQuantity}`,
          //       installment: _expense.installment! + difference,
          //     })
          //   )
          // );
        }
      } else {
        this._expenseStore.update(
          updateEntities(expense.id, { description: expense.description, installmentQuantity }),
          updateEntitiesByPredicate(
            (_expense) =>
              !!_expense.installmentId &&
              _expense.installmentId === expense.installmentId &&
              !_expense.isFirstInstallment,
            (_expense) => ({
              ..._expense,
              description: `${descriptionWithoutInstallments}${_expense.installment}/${installmentQuantity}`,
            })
          )
        );
      }
      return;
    }
    const installmentId = v4();
    const updates: Reducer<ExpenseStore['state']>[] = [
      updateEntities(expense.id, {
        description: expense.description,
        installmentId,
        installment,
        installmentQuantity,
        isFirstInstallment: true,
      }),
    ];
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
      });
    }
    updates.push(addEntities(newEntities));
    this._expenseStore.update(...updates);
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
