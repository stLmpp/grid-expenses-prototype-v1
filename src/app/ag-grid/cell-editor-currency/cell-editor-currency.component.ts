import { ICellEditorAngularComp } from '@ag-grid-community/angular';
import { ICellEditorParams } from '@ag-grid-community/core';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import IMask from 'imask';
import { isNotNil } from 'st-utils';

@Component({
  selector: 'app-cell-editor-currency',
  templateUrl: './cell-editor-currency.component.html',
  styleUrls: ['./cell-editor-currency.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CellEditorCurrencyComponent implements ICellEditorAngularComp, AfterViewInit {
  @ViewChild('input') readonly inputElement!: ElementRef<HTMLInputElement>;

  readonly maskOptions: IMask.MaskedNumberOptions = {
    mask: Number,
    thousandsSeparator: '.',
    radix: ',',
    signed: false,
    scale: 2,
    padFractionalZeros: true,
    mapToRadix: ['.'],
    max: 999_999_999.99,
  };

  value?: string | null;

  agInit(params: ICellEditorParams): void {
    if (!params.value && params.charPress && /\d+/.test(params.charPress)) {
      this.value = params.charPress;
    } else {
      this.value = String(params.value ?? '');
    }
  }

  focusIn(): void {
    this.inputElement.nativeElement.focus();
  }

  focusOut(): void {
    this.inputElement.nativeElement.blur();
  }

  getValue(): number | null | undefined {
    if (!this.value) {
      return null;
    }
    return isNotNil(this.value) ? parseFloat(this.value.replace(/\./g, '').replace(',', '.')) : null;
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.inputElement.nativeElement.focus();
    });
  }
}
