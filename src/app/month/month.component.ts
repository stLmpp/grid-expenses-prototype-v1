import { AgGridAngular } from '@ag-grid-community/angular';
import {
  CellValueChangedEvent,
  ColDef,
  ColumnApi,
  ColumnState,
  FilterChangedEvent,
  GridOptions,
  GridReadyEvent,
  RowDataUpdatedEvent,
  RowDragEvent,
} from '@ag-grid-community/core';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  LOCALE_ID,
  OnDestroy,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { addMonths, setMonth, subMonths } from 'date-fns';
import { auditTime, combineLatest, debounceTime, map, Observable, pairwise, Subject, switchMap, takeUntil } from 'rxjs';
import { Key } from 'ts-key-enum';

import { AG_GRID_LOCALE_PT_BR } from '../ag-grid-pt-br';
import { HeaderPersonComponent, HeaderPersonParams } from '../ag-grid/header-person/header-person.component';
import { MatIconDynamicHtmlService } from '../mat-icon-dynamic-html.service';
import { Expense } from '../models/expense';
import { RouteParamEnum } from '../models/route-param.enum';
import { ExpenseQuery } from '../services/expense/expense.query';
import { ExpenseService } from '../services/expense/expense.service';
import { GlobalListenersService } from '../services/global-listeners/global-listeners.service';
import { GridStateQuery } from '../services/grid-state/grid-state.query';
import { GridStateService } from '../services/grid-state/grid-state.service';
import { getParam } from '../shared/utils/get-param';
import { selectParam } from '../shared/utils/select-param';
import { isRangeSingleRow } from '../shared/utils/utilts';

interface ColumnStateChangedEvent {
  year: number;
  month: number;
  columnsState: ColumnState[];
}

@Component({
  selector: 'app-month',
  templateUrl: './month.component.html',
  styleUrls: ['./month.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonthComponent implements OnDestroy {
  private readonly _localeId = inject(LOCALE_ID);
  private readonly _activatedRoute = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _viewContainerRef = inject(ViewContainerRef);
  private readonly _matIconDynamicHtmlService = inject(MatIconDynamicHtmlService);
  private readonly _expenseService = inject(ExpenseService);
  private readonly _expenseQuery = inject(ExpenseQuery);
  private readonly _gridStateService = inject(GridStateService);
  private readonly _gridStateQuery = inject(GridStateQuery);
  private readonly _globalListenersService = inject(GlobalListenersService);

  private readonly _month$ = selectParam(RouteParamEnum.month, { nonNullable: true });
  private readonly _columnStateChanged$ = new Subject<ColumnStateChangedEvent>();
  private readonly _destroy$ = new Subject<void>();

  private readonly _addIcon = 'add';
  private readonly _deleteIcon = 'remove';

  private readonly _intl = Intl.DateTimeFormat(this._localeId, { month: 'long' });

  @ViewChild(AgGridAngular) readonly agGrid?: AgGridAngular<Expense>;
  @ViewChild(AgGridAngular, { read: ElementRef }) readonly agGridElement?: ElementRef<HTMLElement>;

  readonly year$ = selectParam(RouteParamEnum.year, { nonNullable: true });
  readonly monthInFull$ = this._month$.pipe(map((month) => this._intl.format(setMonth(new Date(), month - 1))));

  readonly expenses$ = combineLatest([this.year$, this._month$]).pipe(
    switchMap(([year, month]) => this._expenseQuery.selectMonth(year, month))
  );
  readonly colDefs$ = this._expenseQuery.colDefs$;
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
          const model = params.api.getModel();
          const lastIndex = model.getRowCount() - 1;
          if (
            params.node.rowIndex !== lastIndex &&
            params.event.shiftKey &&
            (params.event.metaKey || params.event.altKey)
          ) {
            const targetIndex = params.node.rowIndex! + 1;
            const targetNode = model.getRow(targetIndex)!;
            this._expenseService.move(this._getYear(), this._getMonth(), params.node.id!, targetNode.id!);
            params.api.clearRangeSelection();
            params.api.setFocusedCell(targetIndex, params.column);
            return true;
          }
          break;
        }
        case Key.ArrowUp: {
          if (params.node.rowIndex && params.event.shiftKey && (params.event.metaKey || params.event.altKey)) {
            const targetIndex = params.node.rowIndex - 1;
            const targetNode = params.api.getModel().getRow(targetIndex)!;
            this._expenseService.move(this._getYear(), this._getMonth(), params.node.id!, targetNode.id!);
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
            const newRow = this._expenseService.getBlankRow(this._getYear(), this._getMonth());
            params.api.applyTransaction({
              add: [newRow],
            });
            params.api.setFocusedCell(newIndex, params.column);
            params.api.ensureIndexVisible(newIndex);
            this._expenseService.add(newRow);
          }
          break;
        }
        case Key.Delete: {
          const selectedRows = params.api.getSelectedRows();
          if (selectedRows.length) {
            const lastIndex = params.api.getModel().getRowCount() - 1;
            this._expenseService.delete(
              this._getYear(),
              this._getMonth(),
              selectedRows.map((row) => row.id)
            );
            if (params.node.rowIndex && params.node.rowIndex === lastIndex) {
              params.api.setFocusedCell(lastIndex - 1, params.column);
            }
          }
          break;
        }
        case '-': {
          if (params.event.ctrlKey || params.event.metaKey) {
            params.event.preventDefault();
            if (isRangeSingleRow(params.api)) {
              const lastIndex = params.api.getModel().getRowCount() - 1;
              this._expenseService.delete(this._getYear(), this._getMonth(), params.node.id!);
              if (params.node.rowIndex && params.node.rowIndex === lastIndex) {
                params.api.setFocusedCell(lastIndex - 1, params.column);
              }
            }
          }
          break;
        }
        case '+': {
          if (params.event.ctrlKey || params.event.metaKey) {
            params.event.preventDefault();
            if (isRangeSingleRow(params.api)) {
              const newIndex = params.node.rowIndex! + 1;
              this._expenseService.addBlankAt(this._getYear(), this._getMonth(), newIndex);
              params.api.setFocusedCell(newIndex, params.column);
            }
          }
          break;
        }
      }
      return false;
    },
  };
  readonly pinnedTopRowData$: Observable<Pick<Expense, 'people'>[]> = combineLatest([
    this._expenseQuery.people$,
    this.expenses$,
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
    suppressRowClickSelection: true,
    localeText: AG_GRID_LOCALE_PT_BR,
    enableRangeHandle: true,
    enableFillHandle: true,
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

  private _getYear(): number {
    return getParam(this._activatedRoute, RouteParamEnum.year)!;
  }

  private _getMonth(): number {
    return getParam(this._activatedRoute, RouteParamEnum.month)!;
  }

  onCellValueChanged($event: CellValueChangedEvent<Expense>): void {
    this._expenseService.update($event.node.id!, $event.data);
  }

  onGridReady($event: GridReadyEvent<Expense>): void {
    // this._expenseService.generateRandomData(this._getYear(), this._getMonth(), 1);
    this._expenseService.generateRandomDataMultipleMonths();
    this._columnStateChanged$
      .pipe(takeUntil(this._destroy$), debounceTime(250))
      .subscribe(({ year, month, columnsState }) => {
        this._gridStateService.upsertColumnsState(year, month, columnsState);
      });
    const originalColumnsState = $event.columnApi.getColumnState();
    this._gridStateService.addIfNotExists(this._getYear(), this._getMonth(), originalColumnsState);
    combineLatest([this.year$.pipe(pairwise()), this._month$.pipe(pairwise())])
      .pipe(takeUntil(this._destroy$))
      .subscribe(([[oldYear, year], [oldMonth, month]]) => {
        const cell = $event.api.getFocusedCell();
        this._gridStateService.upsertFocusedCell(
          oldYear,
          oldMonth,
          cell ? { rowIndex: cell.rowIndex, colId: cell.column.getColId() } : null
        );
        this._gridStateService.addIfNotExists(year, month, originalColumnsState);
      });
    combineLatest([this.year$, this._month$])
      .pipe(
        switchMap(([year, month]) => this._gridStateQuery.selectState(year, month)),
        takeUntil(this._destroy$),
        auditTime(0)
      )
      .subscribe((state) => {
        $event.columnApi.applyColumnState({
          state: state.columnsState,
          applyOrder: true,
        });
        $event.api.setFilterModel(state.filter);
        if (state.focusedCell) {
          $event.api.setFocusedCell(state.focusedCell.rowIndex, state.focusedCell.colId);
          $event.api.ensureIndexVisible(state.focusedCell.rowIndex, 'middle');
          $event.api.ensureColumnVisible(state.focusedCell.colId, 'middle');
        } else {
          if ($event.api.getModel().getRowCount()) {
            $event.api.ensureIndexVisible(0);
            $event.api.setFocusedCell(0, $event.columnApi.getAllGridColumns()[0]);
          }
          const [column] = $event.columnApi.getAllGridColumns();
          $event.api.ensureColumnVisible(column);
        }
      });
    this._globalListenersService.documentKeydown$.pipe(takeUntil(this._destroy$)).subscribe((event) => {
      this.onGridKeydown(event);
    });
  }

  onRowDataUpdated($event: RowDataUpdatedEvent<Expense>): void {
    const cell = $event.api.getFocusedCell();
    if (cell) {
      $event.api.setFocusedCell(cell.rowIndex, cell.column);
    }
  }

  onRowDragEnd($event: RowDragEvent<Expense>): void {
    if (!$event.overNode?.id) {
      return;
    }
    this._expenseService.move(this._getYear(), this._getMonth(), $event.node.id!, $event.overNode.id);
  }

  ngOnDestroy(): void {
    this._matIconDynamicHtmlService.destroy(this._addIcon);
    this._matIconDynamicHtmlService.destroy(this._deleteIcon);
    this._destroy$.next();
    this._destroy$.complete();
  }

  nextMonth(): void {
    const currentMonth = this._getMonth();
    const currentYear = this._getYear();
    const nextDate = addMonths(new Date(currentYear, currentMonth - 1), 1);
    const month = nextDate.getMonth() + 1;
    const year = nextDate.getFullYear();
    const commands: any[] = year === currentYear ? ['../', month] : ['../../../', year, 'month', month];
    this._router.navigate(commands, { relativeTo: this._activatedRoute });
  }

  nextYear(): void {
    const currentMonth = this._getMonth();
    const currentYear = this._getYear();
    this._router.navigate(['../../../', currentYear + 1, 'month', currentMonth], { relativeTo: this._activatedRoute });
  }

  previousMonth(): void {
    const currentMonth = this._getMonth();
    const currentYear = this._getYear();
    const nextDate = subMonths(new Date(currentYear, currentMonth - 1), 1);
    const month = nextDate.getMonth() + 1;
    const year = nextDate.getFullYear();
    const commands: any[] = year === currentYear ? ['../', month] : ['../../../', year, 'month', month];
    this._router.navigate(commands, { relativeTo: this._activatedRoute });
  }

  previousYear(): void {
    const currentMonth = this._getMonth();
    const currentYear = this._getYear();
    this._router.navigate(['../../../', currentYear - 1, 'month', currentMonth], { relativeTo: this._activatedRoute });
  }

  generateRandomData(): void {
    this._expenseService.generateRandomData(this._getYear(), this._getMonth());
  }

  onFilterChanged($event: FilterChangedEvent<Expense>): void {
    this._gridStateService.upsertFilter(this._getYear(), this._getMonth(), $event.api.getFilterModel());
  }

  onColumnStateChange<T extends { columnApi: ColumnApi; source: string }>($event: T): void {
    if ($event.source === 'api') {
      return;
    }
    this._columnStateChanged$.next({
      month: this._getMonth(),
      columnsState: $event.columnApi.getColumnState(),
      year: this._getYear(),
    });
  }

  onGridKeydown($event: KeyboardEvent): void {
    switch ($event.key) {
      case 'z':
      case 'Z': {
        if ($event.ctrlKey) {
          this._expenseService.undo();
        }
        break;
      }
      case 'y':
      case 'Y': {
        if ($event.ctrlKey) {
          this._expenseService.redo();
        }
        break;
      }
    }
  }
}
