import { AgGridModule } from '@ag-grid-community/angular';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { MonthRoutingModule } from './month-routing.module';
import { MonthComponent } from './month.component';
import { MatButtonModule } from '@angular/material/button';

@NgModule({
  declarations: [MonthComponent],
  imports: [CommonModule, MonthRoutingModule, AgGridModule, MatButtonModule],
})
export class MonthModule {}
