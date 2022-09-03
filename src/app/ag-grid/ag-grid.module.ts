import { AgGridModule as AgGridModuleOriginal } from '@ag-grid-community/angular';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import { GridChartsModule } from '@ag-grid-enterprise/charts';
import { ClipboardModule } from '@ag-grid-enterprise/clipboard';
import { ColumnsToolPanelModule } from '@ag-grid-enterprise/column-tool-panel';
import { ExcelExportModule } from '@ag-grid-enterprise/excel-export';
import { FiltersToolPanelModule } from '@ag-grid-enterprise/filter-tool-panel';
import { MenuModule } from '@ag-grid-enterprise/menu';
import { MultiFilterModule } from '@ag-grid-enterprise/multi-filter';
import { RangeSelectionModule } from '@ag-grid-enterprise/range-selection';
import { RichSelectModule } from '@ag-grid-enterprise/rich-select';
import { SetFilterModule } from '@ag-grid-enterprise/set-filter';
import { SideBarModule } from '@ag-grid-enterprise/side-bar';
import { StatusBarModule } from '@ag-grid-enterprise/status-bar';
import { NgIf } from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { NgxMaskModule } from 'ngx-mask';

import { CellEditorCurrencyComponent } from './cell-editor-currency/cell-editor-currency.component';
import { CellEditorDateComponent } from './cell-editor-date/cell-editor-date.component';
import { HeaderPersonComponent } from './header-person/header-person.component';

const MODULES = [AgGridModuleOriginal, NgxMaskModule.forChild(), FormsModule, NgIf, MatIconModule];

@NgModule({
  declarations: [CellEditorCurrencyComponent, HeaderPersonComponent, CellEditorDateComponent],
  imports: [MODULES],
  exports: [MODULES],
})
export class AgGridModule {
  static forChild(): ModuleWithProviders<AgGridModule> {
    ModuleRegistry.registerModules([
      RangeSelectionModule,
      ClientSideRowModelModule,
      GridChartsModule,
      ClipboardModule,
      ExcelExportModule,
      FiltersToolPanelModule,
      MenuModule,
      MultiFilterModule,
      RichSelectModule,
      SetFilterModule,
      SideBarModule,
      StatusBarModule,
      ColumnsToolPanelModule,
    ]);
    return {
      ngModule: AgGridModule,
    };
  }
}
