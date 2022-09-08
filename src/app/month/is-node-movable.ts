import { RowNode } from '@ag-grid-community/core';

import { Expense } from '../models/expense';
import { isExpenseInstallment } from '../services/installment/is-expense-installment';

export function isNodeMovable(node: RowNode<Expense>): boolean {
  return !!node.data && !node.data.otherCard && (!isExpenseInstallment(node.data) || node.data.isFirstInstallment);
}
