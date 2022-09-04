import { ColDef } from '@ag-grid-community/core';
import { format, isDate, isEqual } from 'date-fns';

import { requiredValidation } from '../ag-grid-validations';
import { CellEditorDateComponent } from '../ag-grid/cell-editor-date/cell-editor-date.component';
import { Expense } from '../models/expense';

export function getDefaultColDefs(): ColDef<Expense>[] {
  return [
    {
      field: '$__rowDrag__$',
      headerName: '',
      rowDrag: true,
      width: 40,
      filter: false,
      resizable: false,
      suppressMovable: true,
      suppressMenu: true,
      sortable: false,
    },
    {
      field: '$__selected__$',
      headerName: '',
      checkboxSelection: true,
      headerCheckboxSelection: true,
      width: 40,
      filter: false,
      resizable: false,
      suppressMovable: true,
      suppressMenu: true,
      sortable: false,
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
      equals: (valueA, valueB) => {
        if (isDate(valueA) && isDate(valueB)) {
          return isEqual(valueA, valueB);
        }
        return valueA === valueB;
      },
    },
    {
      field: 'description',
      editable: true,
      width: 400,
      headerName: 'Descrição',
      ...requiredValidation,
    },
  ];
}
