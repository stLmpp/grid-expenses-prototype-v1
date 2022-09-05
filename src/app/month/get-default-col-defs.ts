import { ColDef, ColumnFunctionCallbackParams } from '@ag-grid-community/core';
import { format, isDate, isEqual } from 'date-fns';

import { requiredValidation } from '../ag-grid/ag-grid-validations';
import { CellEditorDateComponent } from '../ag-grid/cell-editor-date/cell-editor-date.component';
import { AgGridClassesEnum } from '../ag-grid/classes.enum';
import { Expense } from '../models/expense';

function isEditable<T extends ColumnFunctionCallbackParams<Expense>>(params: T): boolean {
  return !params.node.isRowPinned() && (!params.data?.installmentId || !!params.data.isFirstInstallment);
}

const controlDefaultColDef: ColDef<Expense> = {
  headerName: '',
  width: 40,
  filter: false,
  resizable: false,
  suppressMovable: true,
  suppressMenu: true,
  sortable: false,
  cellClass: AgGridClassesEnum.NotEditable,
  suppressFillHandle: true,
  suppressCellFlash: true,
  suppressSizeToFit: true,
  suppressPaste: true,
  suppressAutoSize: true,
};

export function getDefaultColDefs(): ColDef<Expense>[] {
  return [
    {
      field: '$__rowDrag__$',
      rowDrag: true,
      ...controlDefaultColDef,
    },
    {
      field: '$__selected__$',
      checkboxSelection: true,
      headerCheckboxSelection: true,
      ...controlDefaultColDef,
    },
    {
      field: 'date',
      editable: (params) => isEditable(params),
      cellClass: (params) => (isEditable(params) ? null : AgGridClassesEnum.NotEditable),
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
      editable: (params) => isEditable(params),
      cellClass: (params) => (isEditable(params) ? null : AgGridClassesEnum.NotEditable),
      width: 400,
      headerName: 'Descrição',
      ...requiredValidation,
    },
  ];
}
