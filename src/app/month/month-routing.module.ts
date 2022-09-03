import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MonthComponent } from './month.component';
import { MonthGuard } from './month.guard';

const routes: Routes = [
  {
    path: '',
    component: MonthComponent,
    canActivate: [MonthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MonthRoutingModule {}
