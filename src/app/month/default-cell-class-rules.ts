import { CellClassRules } from '@ag-grid-community/core';

import { Expense } from '../models/expense';
import { isExpenseInstallment } from '../services/installment/is-expense-installment';

export const defaultCellClassRules: CellClassRules<Expense> = {
  installment: (params) => !!params.data && isExpenseInstallment(params.data),
  'other-card': (params) => !!params.data?.otherCard,
};
