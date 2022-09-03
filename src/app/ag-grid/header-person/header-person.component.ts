import { IHeaderAngularComp } from '@ag-grid-community/angular';
import { IHeaderParams } from '@ag-grid-community/core';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  QueryList,
  ViewChild,
  ViewChildren,
  ViewEncapsulation,
} from '@angular/core';
import { Subject, take, takeUntil } from 'rxjs';
import { noop, OrderByDirection } from 'st-utils';

import { Expense } from '../../models/expense';
import { Person } from '../../models/person';
import { PersonService } from '../../services/person/person.service';

export interface HeaderPersonParams {
  person: Person;
  newPerson$: Subject<void>;
  deletePerson$: Subject<void>;
}

type IHeaderPersonParams<T = any> = HeaderPersonParams & IHeaderParams<T>;

@Component({
  selector: 'app-header-person',
  templateUrl: './header-person.component.html',
  styleUrls: ['./header-person.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class HeaderPersonComponent implements IHeaderAngularComp, OnDestroy, AfterViewInit {
  private readonly _personService = inject(PersonService);

  private readonly _destroy$ = new Subject<void>();

  private _removeListener = noop;

  @ViewChild('menu') readonly menuElement!: ElementRef<HTMLSpanElement>;
  @ViewChildren('input') readonly inputElements!: QueryList<ElementRef<HTMLInputElement>>;
  @ViewChild('input') readonly inputElement!: ElementRef<HTMLInputElement>;

  params!: IHeaderPersonParams<Expense>;
  sort: OrderByDirection | null = null;
  editing = false;

  name!: string;

  private _init(params: IHeaderPersonParams<Expense>): void {
    this._destroy$.next();
    this.params = params;
    this.name = this.params.displayName;
    if (!this.name) {
      this.editing = true;
    }
    this.onSortChanged();
    this.params.newPerson$.pipe(takeUntil(this._destroy$)).subscribe(() => {
      this.onAddPerson();
    });
    this.params.deletePerson$.pipe(takeUntil(this._destroy$)).subscribe(() => {
      this._personService.delete(this.params.person.id);
    });
  }

  private _focusOnInputWhenReady(): void {
    this.inputElements.changes.pipe(take(1)).subscribe(() => {
      this.inputElements.get(0)?.nativeElement.focus();
    });
  }

  @HostListener('click')
  onClick(): void {
    let sort: OrderByDirection | null;
    switch (this.sort) {
      case 'asc': {
        sort = 'desc';
        break;
      }
      case 'desc': {
        sort = null;
        break;
      }
      default: {
        sort = 'asc';
        break;
      }
    }
    this.params.setSort(sort);
  }

  agInit(params: IHeaderPersonParams<Expense>): void {
    this._init(params);
    const listener = (): void => {
      this.onSortChanged();
    };
    this.params.column.addEventListener('sortChanged', listener);
    this._removeListener = () => this.params.column.removeEventListener('sortChanged', listener);
  }

  onSortChanged(): void {
    if (this.params.column.isSortAscending()) {
      this.sort = 'asc';
    }
    if (this.params.column.isSortDescending()) {
      this.sort = 'desc';
    }
    if (this.params.column.isSortNone()) {
      this.sort = null;
    }
  }

  refresh(params: IHeaderPersonParams<Expense>): boolean {
    const shouldRefresh = params.person.id !== this.params.person.id || params.person.name !== this.params.person.name;
    this._init(params);
    return shouldRefresh;
  }

  onAddPerson(): void {
    const colId = this.params.column.getColId();
    const index = this.params.columnApi
      .getAllGridColumns()
      .filter((column) => {
        const params = column.getColDef().headerComponentParams as HeaderPersonParams | null | undefined;
        return params?.person;
      })
      .findIndex((column) => column.getColId() === colId);
    if (index >= 0) {
      this._personService.addBlankAt(index + 1);
    }
  }

  onEditName($event: MouseEvent): void {
    $event.stopPropagation();
    this.editing = true;
    this._focusOnInputWhenReady();
  }

  onNameChangeKeyDown($event: Event): void {
    $event.stopPropagation();
    this.onNameChange();
  }

  onNameChange(): void {
    if (!this.name) {
      return;
    }
    if (this.name !== this.params.person.name) {
      this._personService.updateName(this.params.person.id, this.name);
    }
    this.editing = false;
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (!this.name) {
        this.inputElement.nativeElement.focus();
      }
    });
  }

  ngOnDestroy(): void {
    this._removeListener();
    this._destroy$.next();
    this._destroy$.complete();
  }
}
