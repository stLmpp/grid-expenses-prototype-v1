import { ICellEditorAngularComp } from '@ag-grid-community/angular';
import { ICellEditorParams } from '@ag-grid-community/core';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { addDays, addMonths, addYears, format, isDate, isValid, parse, subDays, subMonths, subYears } from 'date-fns';
import IMask from 'imask';
import { Subject, takeUntil } from 'rxjs';
import { isString } from 'st-utils';
import { Key } from 'ts-key-enum';

import { Expense } from '../../models/expense';

@Component({
  selector: 'app-cell-editor-date',
  templateUrl: './cell-editor-date.component.html',
  styleUrls: ['./cell-editor-date.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CellEditorDateComponent implements ICellEditorAngularComp, AfterViewInit, OnInit, OnDestroy {
  private readonly _destroy$ = new Subject<void>();
  private readonly _keydown$ = new Subject<KeyboardEvent>();

  @ViewChild('input') readonly inputElement!: ElementRef<HTMLInputElement>;

  readonly maskOptions: IMask.AnyMaskedOptions = {
    mask: Date,
    pattern: 'd/`m/`Y',
    format: (date) => format(date, 'dd/MM/yyyy'),
    parse: (date) => parse(date, 'dd/MM/yyyy', new Date()),
    lazy: false,
    blocks: {
      yyyy: {
        mask: IMask.MaskedRange,
        from: 1970,
        to: 2999,
      },
      mm: {
        mask: IMask.MaskedRange,
        from: 1,
        to: 12,
      },
      dd: {
        mask: IMask.MaskedRange,
        from: 1,
        to: 31,
      },
    },
  };

  params!: ICellEditorParams<Expense>;
  value?: string | null;

  private _formatDate(date: Date): string {
    return format(date, 'dd/MM/yyyy');
  }

  private _parseDate(date: string): Date {
    return parse(date, 'dd/MM/yyyy', new Date());
  }

  private _handleArrowDown(event: KeyboardEvent): void {
    const isMetaOrAlt = event.metaKey || event.altKey;
    const addFn = isMetaOrAlt && event.shiftKey ? addYears : isMetaOrAlt ? addMonths : addDays;
    if (!this.value) {
      this.value = this._formatDate(addFn(new Date(), 1));
      return;
    }
    this.value = this._formatDate(addFn(this._parseDate(this.value), 1));
  }

  private _handleArrowUp(event: KeyboardEvent): void {
    const isMetaOrAlt = event.metaKey || event.altKey;
    const subFn = isMetaOrAlt && event.shiftKey ? subYears : isMetaOrAlt ? subMonths : subDays;
    if (!this.value) {
      this.value = this._formatDate(subFn(new Date(), 1));
      return;
    }
    this.value = this._formatDate(subFn(this._parseDate(this.value), 1));
  }

  private _focusOnDayAndMonth(): void {
    if (this.value && this.value.length >= 4) {
      // TODO fix this
      this.inputElement.nativeElement.setSelectionRange(0, 5);
    }
  }

  agInit(params: ICellEditorParams): void {
    if (!params.value && params.charPress && /\d+/.test(params.charPress)) {
      this.value = params.charPress;
    } else if (isString(params.value)) {
      this.value = params.value;
    } else if (isDate(params.value)) {
      this.value = this._formatDate(params.value);
    }
    this.params = params;
  }

  focusIn(): void {
    this.inputElement.nativeElement.focus();
  }

  focusOut(): void {
    this.inputElement.nativeElement.blur();
  }

  getValue(): Date | null | undefined {
    if (!this.value) {
      return this.params.data.date;
    }
    const date = this._parseDate(this.value);
    return isValid(date) ? date : null;
  }

  onKeydown($event: KeyboardEvent): void {
    this._keydown$.next($event);
  }

  ngOnInit(): void {
    this._keydown$.pipe(takeUntil(this._destroy$)).subscribe((event) => {
      switch (event.key) {
        case Key.ArrowUp: {
          this._handleArrowUp(event);
          this._focusOnDayAndMonth();
          break;
        }
        case Key.ArrowDown: {
          this._handleArrowDown(event);
          this._focusOnDayAndMonth();
          break;
        }
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.inputElement.nativeElement.focus();
      if (this.value && this.value.length >= 4) {
        this.inputElement.nativeElement.setSelectionRange(0, 5);
      }
    });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}
