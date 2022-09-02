import { AgGridAngular } from '@ag-grid-community/angular';
import {
  CellValueChangedEvent,
  ColDef,
  GridOptions,
  GridReadyEvent,
  RowDataUpdatedEvent,
  RowDragEvent,
} from '@ag-grid-community/core';
import { ChangeDetectionStrategy, Component, inject, OnDestroy, ViewChild, ViewContainerRef } from '@angular/core';
import { combineLatest, map, Observable } from 'rxjs';
import { Key } from 'ts-key-enum';

import { AppService } from './app.service';
import { HeaderPersonComponent, HeaderPersonParams } from './header-person/header-person.component';
import { MatIconDynamicHtmlService } from './mat-icon-dynamic-html.service';
import { Expense } from './models/expense';
import { isRangeSingleRow } from './utilts';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnDestroy {
  private readonly _appService = inject(AppService);
  private readonly _viewContainerRef = inject(ViewContainerRef);
  private readonly _matIconDynamicHtmlService = inject(MatIconDynamicHtmlService);

  private readonly _addIcon = 'add';
  private readonly _deleteIcon = 'remove';

  @ViewChild(AgGridAngular) readonly agGrid?: AgGridAngular;

  readonly data$ = this._appService.expenses$;
  readonly colDefs$ = this._appService.colDefs$;
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
              this._appService.deleteRow(params.node.id!);
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
            this._appService.deleteRows(selectedRows.map((row) => row.id));
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
            this._appService.move(params.node.rowIndex!, targetIndex);
            params.api.clearRangeSelection();
            params.api.setFocusedCell(targetIndex, params.column);
            return true;
          }
          break;
        }
        case Key.ArrowUp: {
          if (params.node.rowIndex && params.event.shiftKey && (params.event.metaKey || params.event.altKey)) {
            const targetIndex = params.node.rowIndex - 1;
            this._appService.move(params.node.rowIndex, targetIndex);
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
            const newRow = this._appService.getBlankRow();
            params.api.applyTransaction({
              add: [newRow],
            });
            params.api.setFocusedCell(newIndex, params.column);
            params.api.ensureIndexVisible(newIndex);
            this._appService.addRow(newRow);
          }
          break;
        }
        case '+': {
          if (params.event.ctrlKey || params.event.metaKey) {
            params.event.preventDefault();
            if (isRangeSingleRow(params.api)) {
              const newIndex = params.node.rowIndex! + 1;
              this._appService.addBlankRowAt(newIndex);
              params.api.setFocusedCell(newIndex, params.column);
            }
          }
        }
      }
      return false;
    },
  };
  readonly pinnedTopRowData$: Observable<Pick<Expense, 'people'>[]> = combineLatest([
    this._appService.people$,
    this.data$,
  ]).pipe(
    map(([people, expenses]) => {
      const peopleObject: Record<string, number> = people.reduce((acc, item) => ({ ...acc, [item.id]: 0 }), {});
      for (const expense of expenses) {
        const entries = Object.entries(expense.people);
        for (const [key, value] of entries) {
          peopleObject[key] ??= 0;
          peopleObject[key] += value ?? 0;
        }
      }
      return [{ people: peopleObject }];
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
      statusPanels: [
        { statusPanel: 'agTotalAndFilteredRowCountComponent', align: 'left' },
        { statusPanel: 'agAggregationComponent', align: 'right' },
      ],
    },
    localeText: {
      thousandSeparator: '.',
      decimalSeparator: ',',
    },
    getMainMenuItems: (params) => {
      const headerPersonColumns =
        params.columnApi
          .getColumns()
          ?.filter((column) => column.getColDef().headerComponent === HeaderPersonComponent) ?? [];
      const isHeaderPersonColumn = params.column.getColDef().headerComponent === HeaderPersonComponent;
      const headerPersonParams = params.column.getColDef().headerComponentParams as HeaderPersonParams | null;
      const iconAdd = this._matIconDynamicHtmlService.get(this._viewContainerRef, 'add');
      const iconDelete = this._matIconDynamicHtmlService.get(this._viewContainerRef, 'delete');
      return [
        {
          name: 'Add person',
          action: () => {
            if (!headerPersonParams) {
              return;
            }
            headerPersonParams.newPerson$.next();
          },
          disabled: !isHeaderPersonColumn || !headerPersonParams,
          icon: iconAdd,
        },
        {
          name: 'Delete person',
          action: () => {
            if (!headerPersonParams) {
              return;
            }
            headerPersonParams.deletePerson$.next();
          },
          disabled: !isHeaderPersonColumn || !headerPersonParams || headerPersonColumns.length <= 1,
          icon: iconDelete,
        },
        ...params.defaultItems,
      ];
    },
    getRowId: (config) => config.data.id,
  };

  onCellValueChanged($event: CellValueChangedEvent<Expense>): void {
    console.log($event);
    this._appService.updateRow($event.node.id!, $event.data);
  }

  onGridReady($event: GridReadyEvent<Expense>): void {
    this._appService.generateRandomData();
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
    this._appService.move($event.node.rowIndex!, $event.overIndex);
  }

  ngOnDestroy(): void {
    this._matIconDynamicHtmlService.destroy(this._addIcon);
    this._matIconDynamicHtmlService.destroy(this._deleteIcon);
  }
}
