import { AgGridAngular } from '@ag-grid-community/angular';
import {
  CellValueChangedEvent,
  ColDef,
  GridOptions,
  GridReadyEvent,
  RowDataUpdatedEvent,
  RowDragEvent,
} from '@ag-grid-community/core';
import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { Key } from 'ts-key-enum';

import { AppService } from './app.service';
import { Expense } from './models/expense';
import { isRangeSingleRow } from './utilts';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  constructor(private readonly appService: AppService) {}

  @ViewChild(AgGridAngular) readonly agGrid?: AgGridAngular;

  readonly data$ = this.appService.expenses$.pipe(
    tap((data) => {
      console.log({ data });
    })
  );
  readonly colDefs$ = this.appService.colDefs$;
  readonly defaultColDef: ColDef<Expense> = {
    filter: true,
    sortable: true,
    resizable: true,
    editable: false,
    floatingFilter: true,
    suppressKeyboardEvent: (params) => {
      if (params.editing) {
        return false;
      }
      switch (params.event.key) {
        case '-': {
          if (params.event.ctrlKey || params.event.metaKey) {
            params.event.preventDefault();
            if (isRangeSingleRow(params.api)) {
              const lastIndex = params.api.getModel().getRowCount() - 1;
              this.appService.deleteRow(params.node.id!);
              if (params.node.rowIndex && params.node.rowIndex === lastIndex) {
                params.api.setFocusedCell(lastIndex - 1, params.column);
              }
            }
          }
          break;
        }
        case Key.Delete: {
          const selectedRows = params.api.getSelectedRows();
          if (selectedRows.length) {
            this.appService.deleteRows(selectedRows.map((row) => row.id));
          }
          break;
        }
        case ' ': {
          const range = params.api.getCellRanges();
          if (range) {
            for (const r of range) {
              if (r.startRow && r.endRow) {
                for (let i = r.startRow.rowIndex; i <= r.endRow.rowIndex; i++) {
                  const node = params.api.getModel().getRow(i);
                  node?.setSelected(!node.isSelected());
                }
              }
            }
            params.event.preventDefault();
            return true;
          }
          break;
        }
        case Key.ArrowDown: {
          const lastIndex = params.api.getModel().getRowCount() - 1;
          if (
            params.node.rowIndex !== lastIndex &&
            params.event.shiftKey &&
            (params.event.metaKey || params.event.altKey)
          ) {
            const targetIndex = params.node.rowIndex! + 1;
            this.appService.move(params.node.rowIndex!, targetIndex);
            params.api.clearRangeSelection();
            params.api.setFocusedCell(targetIndex, params.column);
            return true;
          }
          break;
        }
        case Key.ArrowUp: {
          if (params.node.rowIndex && params.event.shiftKey && (params.event.metaKey || params.event.altKey)) {
            const targetIndex = params.node.rowIndex - 1;
            this.appService.move(params.node.rowIndex, targetIndex);
            params.api.clearRangeSelection();
            params.api.setFocusedCell(targetIndex, params.column);
            return true;
          }
          break;
        }
        case 'L':
        case 'l': {
          if (params.event.ctrlKey || params.event.metaKey) {
            params.event.preventDefault();
            const newIndex = params.api.getModel().getRowCount();
            const newRow = this.appService.getBlankRow();
            params.api.applyTransaction({
              add: [newRow],
            });
            params.api.setFocusedCell(newIndex, params.column);
            params.api.ensureIndexVisible(newIndex);
            this.appService.addRow(newRow);
          }
          break;
        }
        case '+': {
          if (params.event.ctrlKey || params.event.metaKey) {
            params.event.preventDefault();
            if (isRangeSingleRow(params.api)) {
              const newIndex = params.node.rowIndex! + 1;
              this.appService.addBlankRowAt(newIndex);
              params.api.setFocusedCell(newIndex, params.column);
            }
          }
        }
      }
      return false;
    },
  };
  readonly pinnedTopRowData$: Observable<Pick<Expense, 'people'>[]> = this.data$.pipe(
    map((expenses) => {
      const people: Record<string, number> = {};
      for (const expense of expenses) {
        const entries = Object.entries(expense.people);
        for (const [key, value] of entries) {
          people[key] ??= 0;
          people[key] += value;
        }
      }
      return [{ people }];
    })
  );

  readonly gridOptions: GridOptions<Expense> = {
    defaultColDef: this.defaultColDef,
    animateRows: true,
    enableRangeSelection: true,
    enableCellChangeFlash: true,
    rowSelection: 'multiple',
    enableCharts: true,
    statusBar: {
      statusPanels: [{ statusPanel: 'agTotalAndFilteredRowCountComponent' }],
    },
    getRowId: (config) => config.data.id,
  };

  onCellValueChanged($event: CellValueChangedEvent<Expense>): void {
    console.log($event);
    this.appService.updateRow($event.node.id!, $event.data);
  }

  onGridReady($event: GridReadyEvent<Expense>): void {
    this.appService.generateRandomData();
  }

  onRowDataUpdated($event: RowDataUpdatedEvent<Expense>): void {
    const cell = $event.api.getFocusedCell();
    if (cell) {
      $event.api.setFocusedCell(cell.rowIndex, cell.column);
    }
  }

  onRowDragEnd($event: RowDragEvent<Expense>): void {
    if ($event.overIndex === -1) {
      return;
    }
    this.appService.move($event.node.rowIndex!, $event.overIndex);
  }
}
