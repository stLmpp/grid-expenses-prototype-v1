import { ColDef, Column } from '@ag-grid-community/core';

import { Expense } from './models/expense';

export const requiredValidation: Pick<ColDef<Expense>, 'cellClassRules' | 'tooltipValueGetter'> = {
  cellClassRules: {
    invalid: (params) => !params.node.isRowPinned() && !params.value,
  },
  tooltipValueGetter: (params) => {
    const headerName = (params.column as Column).getColDef().headerName;
    return !params.node?.isRowPinned() && !params.value ? `${headerName} é um campo obrigatório` : null;
  },
};
