import { AsyncPipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

import { AgGridModule } from '../ag-grid/ag-grid.module';

import { MonthRoutingModule } from './month-routing.module';
import { MonthComponent } from './month.component';

@NgModule({
  declarations: [MonthComponent],
  imports: [AsyncPipe, MonthRoutingModule, AgGridModule.forChild(), MatButtonModule],
})
export class MonthModule {}
