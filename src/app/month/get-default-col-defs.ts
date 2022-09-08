import { ColDef, ColumnFunctionCallbackParams } from '@ag-grid-community/core';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { format, isDate, isEqual } from 'date-fns';

import { requiredValidation } from '../ag-grid/ag-grid-validations';
import { CellEditorDateComponent } from '../ag-grid/cell-editor-date/cell-editor-date.component';
import { AgGridClassesEnum } from '../ag-grid/classes.enum';
import { Expense } from '../models/expense';
import { InstallmentUpdateAllowedEnum } from '../services/installment/installment-update-allowed.enum';
import { isDescriptionUpdateAllowed } from '../services/installment/is-description-update-allowed';

import { defaultCellClassRules } from './default-cell-class-rules';
import { isNodeMovable } from './is-node-movable';

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
  cellClassRules: {
    ...defaultCellClassRules,
  },
};

export function getDefaultColDefs(): ColDef<Expense>[] {
  const matSnackBar = inject(MatSnackBar);

  return [
    {
      field: '$__rowDrag__$',
      rowDrag: (params) => isNodeMovable(params.node),
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
      cellClassRules: {
        ...requiredValidation.cellClassRules,
        ...defaultCellClassRules,
      },
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
      valueSetter: (params) => {
        const updateAllowed = isDescriptionUpdateAllowed(params.data, params.newValue);
        const updateAllowedBool = updateAllowed === InstallmentUpdateAllowedEnum.UpdateAllowed;
        if (updateAllowedBool) {
          params.data.description = params.newValue;
        } else {
          matSnackBar.open('Update not allowed', 'Close');
        }
        return updateAllowedBool;
      },
      ...requiredValidation,
      cellClassRules: {
        ...requiredValidation.cellClassRules,
        ...defaultCellClassRules,
        'ag-right-aligned-cell': (params) => params.node.isRowPinned(),
      },
    },
  ];
}
