import { isNotNil } from 'st-utils';

import { Expense, ExpenseInstallment, ExpenseInstallmentKeys } from '../../models/expense';

export function isExpenseInstallment(expense: Expense): expense is ExpenseInstallment {
  const fields: ExpenseInstallmentKeys[] = [
    'installment',
    'installmentId',
    'installmentQuantity',
    'isFirstInstallment',
  ];
  return fields.every((field) => isNotNil(expense[field]));
}
