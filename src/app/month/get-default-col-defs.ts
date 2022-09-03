import { ColDef } from '@ag-grid-community/core';
import { format, isDate } from 'date-fns';

import { requiredValidation } from '../ag-grid-validations';
import { CellEditorDateComponent } from '../cell-editor-date/cell-editor-date.component';
import { Expense } from '../models/expense';


export function getDefaultColDefs(): ColDef<Expense>[] {
  return [
    {
      field: '$__rowDrag__$',
      headerName: '',
      rowDrag: true,
      width: 40,
      filter: false,
    },
    {
      field: '$__selected__$',
      headerName: '',
      checkboxSelection: true,
      headerCheckboxSelection: true,
      width: 40,
      filter: false,
    },
    {
      field: 'date',
      editable: true,
      filter: 'agDateColumnFilter',
      headerName: 'Data',
      width: 150,
      cellEditor: CellEditorDateComponent,
      ...requiredValidation,
      valueFormatter: (params) => {
        if (isDate(params.value)) {
          return format(params.value, 'dd/MM');
        }
        return params.value;
      },
    },
    { field: 'description', editable: true, width: 400, headerName: 'Descrição', ...requiredValidation },
  ]
}
