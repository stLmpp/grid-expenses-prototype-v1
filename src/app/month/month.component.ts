import { AgGridAngular } from '@ag-grid-community/angular';
import {
  CellValueChangedEvent,
  ColDef,
  Column,
  ColumnApi,
  ColumnEverythingChangedEvent,
  ColumnState,
  FilterChangedEvent,
  GridApi,
  GridOptions,
  GridReadyEvent,
  MenuItemDef,
  RowDataUpdatedEvent,
  RowDragEvent,
  RowNode,
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
import { arrayUtil } from 'st-utils';
import { Key } from 'ts-key-enum';

import { AG_GRID_LOCALE_PT_BR } from '../ag-grid/ag-grid-pt-br';
import { HeaderPersonComponent, HeaderPersonParams } from '../ag-grid/header-person/header-person.component';
import { Expense } from '../models/expense';
import { RouteParamEnum } from '../models/route-param.enum';
import { ExpenseQuery } from '../services/expense/expense.query';
import { ExpenseService } from '../services/expense/expense.service';
import { GlobalListenersService } from '../services/global-listeners/global-listeners.service';
import { GridStateQuery } from '../services/grid-state/grid-state.query';
import { GridStateService } from '../services/grid-state/grid-state.service';
import { isExpenseInstallment } from '../services/installment/is-expense-installment';
import { MatIconDynamicHtmlService } from '../services/mat-icon-dynamic-html/mat-icon-dynamic-html.service';
import { findDifferenceIndexBy } from '../shared/utils/find-difference-index-by';
import { getAltSymbol } from '../shared/utils/get-alt-symbol';
import { getParam } from '../shared/utils/get-param';
import { selectParam } from '../shared/utils/select-param';
import { isRangeSingleRow } from '../shared/utils/utilts';

import { isNodeMovable } from './is-node-movable';

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

  private readonly _icons = {
    addIcon: 'add',
    deleteIcon: 'delete',
    creditCardIcon: 'credit_card',
    arrowUpIcon: 'arrow_upward',
    arrowDownIcon: 'arrow_downward',
    deleteForeverIcon: 'delete_forever',
  } as const;

  private readonly _intl = Intl.DateTimeFormat(this._localeId, { month: 'long' });

  private _defaultColumnsState: ColumnState[] = [];

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
          return this._selectRowShortcut(params);
        }
        case Key.ArrowDown: {
          return this._moveRowDownShortcut(params);
        }
        case Key.ArrowUp: {
          return this._moveRowUpShortcut(params);
        }
        case 'L':
        case 'l': {
          this._addNewRowShortcut(params);
          break;
        }
        case Key.Delete: {
          this._deleteSelectRowsShortcut(params);
          break;
        }
        case '-': {
          this._deleteRowShortcut(params);
          break;
        }
        case '+': {
          this._addRowShortcut(params);
          break;
        }
        case 'o':
        case 'O':
          this._toggleOtherCardShortcut(params.node.data!);
      }
      return false;
    },
  };

  readonly pinnedTopRowData$: Observable<Pick<Expense, 'people' | 'description'>[]> = combineLatest([
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
      return [{ people: peopleObject, description: 'Total por pessoa:' }];
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
    enableFillHandle: true,
    tooltipShowDelay: 400,
    getMainMenuItems: (params) => {
      const headerPersonColumns =
        params.columnApi
          .getColumns()
          ?.filter((column) => column.getColDef().headerComponent === HeaderPersonComponent) ?? [];
      const isHeaderPersonColumn = params.column.getColDef().headerComponent === HeaderPersonComponent;
      const headerPersonParams = params.column.getColDef().headerComponentParams as HeaderPersonParams | null;
      const { addIcon, deleteIcon } = this._matIconDynamicHtmlService.getMultiple(this._viewContainerRef, {
        addIcon: this._icons.addIcon,
        deleteIcon: this._icons.deleteIcon,
      });
      return [
        {
          name: 'Adicionar pessoa',
          action: () => {
            if (!headerPersonParams) {
              return;
            }
            headerPersonParams.newPerson$.next();
          },
          disabled: !isHeaderPersonColumn || !headerPersonParams,
          icon: addIcon,
        },
        {
          name: 'Deletar pessoa',
          action: () => {
            if (!headerPersonParams) {
              return;
            }
            headerPersonParams.deletePerson$.next();
          },
          disabled: !isHeaderPersonColumn || !headerPersonParams || headerPersonColumns.length <= 1,
          icon: deleteIcon,
        },
        ...params.defaultItems,
      ];
    },
    getContextMenuItems: (params) => {
      const { addIcon, deleteIcon, deleteForeverIcon, arrowUpIcon, arrowDownIcon, creditCardIcon } =
        this._matIconDynamicHtmlService.getMultiple(this._viewContainerRef, {
          addIcon: this._icons.addIcon,
          deleteIcon: this._icons.deleteIcon,
          creditCardIcon: this._icons.creditCardIcon,
          arrowUpIcon: this._icons.arrowUpIcon,
          arrowDownIcon: this._icons.arrowDownIcon,
          deleteForeverIcon: this._icons.deleteForeverIcon,
        });
      const otherCard = !!params.node?.data?.otherCard;
      const customItems: MenuItemDef[] = [
        {
          name: otherCard ? 'Cartão padrão' : 'Outro cartão',
          icon: creditCardIcon,
          disabled: !params.node || (isExpenseInstallment(params.node.data) && !params.node.data.isFirstInstallment),
          shortcut: `${getAltSymbol()}+Shift+O`,
          action: () => {
            this._toggleOtherCardShortcut(params.node!.data!);
          },
          tooltip: otherCard ? 'Move para o cartão principal' : 'Move para outro cartão',
        },
        {
          name: 'Mover para baixo',
          action: () => {
            this._moveRowUpShortcut({
              api: params.api,
              node: params.node!,
              column: params.column!,
            });
          },
          icon: arrowUpIcon,
          disabled:
            !params.node ||
            !params.column ||
            !params.node.rowIndex ||
            (isExpenseInstallment(params.node.data) && !params.node.data.isFirstInstallment) ||
            !!params.node.data?.otherCard,
          shortcut: `${getAltSymbol()}+Shift+↑`,
          tooltip: 'Move a linha para cima',
        },
        {
          name: 'Mover para cima',
          action: () => {
            this._moveRowDownShortcut({
              api: params.api,
              node: params.node!,
              column: params.column!,
            });
          },
          icon: arrowDownIcon,
          disabled:
            !params.node ||
            !params.column ||
            params.node.rowIndex === params.api.getModel().getRowCount() - 1 ||
            (isExpenseInstallment(params.node.data) && !params.node.data.isFirstInstallment) ||
            !!params.node.data?.otherCard,
          shortcut: `${getAltSymbol()}+Shift+↓`,
          tooltip: 'Move a linha para baixo',
        },
        {
          name: 'Adicionar linha',
          action: () => {
            this._addRowShortcut({
              api: params.api,
              node: params.node!,
              column: params.column!,
            });
          },
          icon: addIcon,
          disabled: !params.node || !params.column,
          shortcut: `${getAltSymbol()}+(+)`,
          tooltip: 'Adiciona uma nova linha abaixo',
        },
        {
          name: 'Deletar linha',
          action: () => {
            this._deleteRowShortcut({
              api: params.api,
              node: params.node!,
              column: params.column!,
            });
          },
          icon: deleteIcon,
          disabled: !params.node || !params.column,
          shortcut: `${getAltSymbol()}+(-)`,
          tooltip: 'Deleta a linha',
        },
        {
          name: 'Deletar selecionados',
          action: () => {
            this._deleteSelectRowsShortcut({
              api: params.api,
              node: params.node!,
              column: params.column!,
            });
          },
          icon: deleteForeverIcon,
          disabled: !params.node || !params.column || !params.api.getSelectedRows().length,
          shortcut: `${getAltSymbol()}+Del`,
          tooltip: 'Deleta as linhas selecionadas',
        },
      ];
      return [...customItems.filter((customItem) => !customItem.disabled), ...(params.defaultItems ?? [])];
    },
    getRowId: (config) => config.data.id,
  };

  private _getYear(): number {
    return getParam(this._activatedRoute, RouteParamEnum.year)!;
  }

  private _getMonth(): number {
    return getParam(this._activatedRoute, RouteParamEnum.month)!;
  }

  private _selectRowShortcut<T extends { api: GridApi<Expense>; event?: KeyboardEvent }>(params: T): boolean {
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
      params.event?.preventDefault();
      return true;
    }
    return false;
  }

  private _moveRowDownShortcut<
    T extends { api: GridApi<Expense>; node: RowNode<Expense>; event?: KeyboardEvent; column: Column }
  >(params: T): boolean {
    const model = params.api.getModel();
    const lastIndex = model.getRowCount() - 1;
    if (
      isNodeMovable(params.node) &&
      params.node.rowIndex !== lastIndex &&
      (!params.event || (params.event.shiftKey && (params.event.metaKey || params.event.altKey)))
    ) {
      const targetIndex = params.node.rowIndex! + 1;
      const targetNode = model.getRow(targetIndex)!;
      this._expenseService.move(this._getYear(), this._getMonth(), params.node.id!, targetNode.id!);
      params.api.clearRangeSelection();
      params.api.setFocusedCell(targetIndex, params.column);
      return true;
    }
    return false;
  }

  private _moveRowUpShortcut<
    T extends { api: GridApi<Expense>; node: RowNode<Expense>; event?: KeyboardEvent; column: Column }
  >(params: T): boolean {
    if (
      isNodeMovable(params.node) &&
      params.node.rowIndex &&
      (!params.event || (params.event.shiftKey && (params.event.metaKey || params.event.altKey)))
    ) {
      const targetIndex = params.node.rowIndex - 1;
      const targetNode = params.api.getModel().getRow(targetIndex)!;
      this._expenseService.move(this._getYear(), this._getMonth(), params.node.id!, targetNode.id!);
      params.api.clearRangeSelection();
      params.api.setFocusedCell(targetIndex, params.column);
      return true;
    }
    return false;
  }

  private _addNewRowShortcut<T extends { event?: KeyboardEvent; api: GridApi<Expense>; column: Column }>(
    params: T
  ): void {
    if (!params.event || params.event.altKey || params.event.metaKey) {
      params.event?.preventDefault();
      const newIndex = params.api.getModel().getRowCount();
      const newRow = this._expenseService.getBlankRow(this._getYear(), this._getMonth());
      params.api.applyTransaction({
        add: [newRow],
      });
      params.api.setFocusedCell(newIndex, params.column);
      params.api.ensureIndexVisible(newIndex);
      this._expenseService.add(newRow);
    }
  }

  private _deleteSelectRowsShortcut<T extends { api: GridApi<Expense>; node: RowNode<Expense>; column: Column }>(
    params: T
  ): void {
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
  }

  private _deleteRowShortcut<
    T extends { event?: KeyboardEvent; api: GridApi<Expense>; node: RowNode<Expense>; column: Column }
  >(params: T): void {
    if (!params.event || params.event.altKey || params.event.metaKey) {
      params.event?.preventDefault();
      if (isRangeSingleRow(params.api)) {
        const lastIndex = params.api.getModel().getRowCount() - 1;
        this._expenseService.delete(this._getYear(), this._getMonth(), params.node.id!);
        if (params.node.rowIndex && params.node.rowIndex === lastIndex) {
          params.api.setFocusedCell(lastIndex - 1, params.column);
        }
      }
    }
  }

  private _addRowShortcut<
    T extends { event?: KeyboardEvent; api: GridApi<Expense>; node: RowNode<Expense>; column: Column }
  >(params: T): void {
    if (!params.event || params.event.altKey || params.event.metaKey) {
      params.event?.preventDefault();
      if (isRangeSingleRow(params.api)) {
        const newIndex = params.node.rowIndex! + 1;
        this._expenseService.addBlankAt(this._getYear(), this._getMonth(), params.node.data!.date.getDate(), newIndex);
        params.api.setFocusedCell(newIndex, params.column);
      }
    }
  }

  private _toggleOtherCardShortcut(expense: Expense): void {
    this._expenseService.updateOtherCard(expense, !expense.otherCard);
  }

  onCellValueChanged($event: CellValueChangedEvent<Expense>): void {
    if ($event.colDef.field === 'description') {
      this._expenseService.updateDescription(this._getYear(), this._getMonth(), $event.data);
    } else if ($event.colDef.headerComponent === HeaderPersonComponent) {
      this._expenseService.updatePersonValue(this._getYear(), this._getMonth(), $event.data);
    } else {
      this._expenseService.update($event.node.id!, $event.data);
    }
  }

  onGridReady($event: GridReadyEvent<Expense>): void {
    // this._expenseService.generateRandomData(this._getYear(), this._getMonth(), 1);
    this._expenseService.generateRandomDataMultipleMonths();
    this._columnStateChanged$
      .pipe(takeUntil(this._destroy$), debounceTime(250))
      .subscribe(({ year, month, columnsState }) => {
        this._gridStateService.upsertColumnsState(year, month, columnsState);
      });
    this._defaultColumnsState = $event.columnApi.getColumnState();
    this._gridStateService.addIfNotExists(this._getYear(), this._getMonth(), this._defaultColumnsState);
    combineLatest([this.year$.pipe(pairwise()), this._month$.pipe(pairwise())])
      .pipe(takeUntil(this._destroy$))
      .subscribe(([[oldYear, year], [oldMonth, month]]) => {
        const cell = $event.api.getFocusedCell();
        this._gridStateService.upsertFocusedCell(
          oldYear,
          oldMonth,
          cell ? { rowIndex: cell.rowIndex, colId: cell.column.getColId() } : null
        );
        this._gridStateService.addIfNotExists(year, month, this._defaultColumnsState);
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
          // TODO this is grabbing focus from the header person input
          // I need to figure out a way to avoid this
          // if ($event.api.getModel().getRowCount()) {
          //   $event.api.ensureIndexVisible(0);
          //   $event.api.setFocusedCell(0, $event.columnApi.getAllGridColumns()[0]);
          // }
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
    const icons = Object.values(this._icons);
    for (const icon of icons) {
      this._matIconDynamicHtmlService.destroy(icon);
    }
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
        if ($event.altKey || $event.metaKey) {
          this._expenseService.undo();
        }
        break;
      }
      case 'y':
      case 'Y': {
        if ($event.altKey || $event.metaKey) {
          this._expenseService.redo();
        }
        break;
      }
    }
  }

  onColumnEverythingChanged($event: ColumnEverythingChangedEvent<Expense>): void {
    if ($event.source === 'api') {
      return;
    }
    const newColumnsState = $event.columnApi.getColumnState();
    if (this._defaultColumnsState.length && newColumnsState.length !== this._defaultColumnsState.length) {
      const difference = findDifferenceIndexBy(newColumnsState, this._defaultColumnsState, 'colId');
      const util = arrayUtil(this._defaultColumnsState, 'colId');
      for (const index of difference) {
        util.insert(newColumnsState[index], index);
      }
      this._defaultColumnsState = util.toArray();
    }
    this.onColumnStateChange($event);
  }
}
