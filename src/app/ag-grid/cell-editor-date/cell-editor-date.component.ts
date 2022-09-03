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
import { Subject, takeUntil } from 'rxjs';
import { isString } from 'st-utils';
import { Key } from 'ts-key-enum';

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

  agInit(params: ICellEditorParams): void {
    if (!params.value && params.charPress && /\d+/.test(params.charPress)) {
      this.value = params.charPress;
    } else if (isString(params.value)) {
      this.value = params.value;
    } else if (isDate(params.value)) {
      this.value = this._formatDate(params.value);
    }
  }

  focusIn(): void {
    this.inputElement.nativeElement.focus();
  }

  focusOut(): void {
    this.inputElement.nativeElement.blur();
  }

  getValue(): Date | null | undefined {
    if (!this.value) {
      return null;
    }
    const date = this._parseDate(this.value);
    return isValid(date) ? date : null;
  }

  onModelChange($event: string | null | undefined): void {
    this.value = $event;
  }

  onKeydown($event: KeyboardEvent): void {
    this._keydown$.next($event);
  }

  ngOnInit(): void {
    this._keydown$.pipe(takeUntil(this._destroy$)).subscribe((event) => {
      switch (event.key) {
        case Key.ArrowUp: {
          this._handleArrowUp(event);
          break;
        }
        case Key.ArrowDown: {
          this._handleArrowDown(event);
          break;
        }
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.inputElement.nativeElement.focus();
    });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}
