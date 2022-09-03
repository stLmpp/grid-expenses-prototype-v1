import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { EmptyParamsGuard } from './empty-params.guard';
import { RouteParamEnum } from './models/route-param.enum';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [EmptyParamsGuard],
    component: AppComponent,
  },
  {
    path: `year/:${RouteParamEnum.year}/month/:${RouteParamEnum.month}`,
    loadChildren: () => import('./month/month.module').then((m) => m.MonthModule),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
