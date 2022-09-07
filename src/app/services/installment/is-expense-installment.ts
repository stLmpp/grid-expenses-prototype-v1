import { isNotNil } from 'st-utils';

import { Expense, ExpenseInstallment, ExpenseInstallmentKeys } from '../../models/expense';

export function isExpenseInstallment(expense: Expense | null | undefined): expense is ExpenseInstallment {
  if (!expense) {
    return false;
  }
  const fields: ExpenseInstallmentKeys[] = [
    'installment',
    'installmentId',
    'installmentQuantity',
    'isFirstInstallment',
  ];
  return fields.every((field) => isNotNil(expense[field]));
}
