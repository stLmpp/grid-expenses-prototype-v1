import { ICellEditorAngularComp } from '@ag-grid-community/angular';
import { ICellEditorParams } from '@ag-grid-community/core';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { isString } from 'st-utils';

// TODO use iMask here and delete ngx-mask from project

@Component({
  selector: 'app-cell-editor-currency',
  templateUrl: './cell-editor-currency.component.html',
  styleUrls: ['./cell-editor-currency.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CellEditorCurrencyComponent implements ICellEditorAngularComp, AfterViewInit {
  @ViewChild('input') readonly inputElement!: ElementRef<HTMLInputElement>;

  value?: number | null;

  agInit(params: ICellEditorParams): void {
    if (!params.value && params.charPress && /\d+/.test(params.charPress)) {
      this.value = parseFloat(params.charPress);
    } else {
      this.value = params.value;
    }
  }

  focusIn(): void {
    this.inputElement.nativeElement.focus();
  }

  focusOut(): void {
    this.inputElement.nativeElement.blur();
  }

  getValue(): number | null | undefined {
    return this.value;
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.inputElement.nativeElement.focus();
    });
  }

  onModelChange($event: string | number | null | undefined): void {
    this.value = isString($event) ? null : $event;
  }
}
