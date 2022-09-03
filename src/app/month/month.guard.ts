import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, createUrlTreeFromSnapshot, UrlTree } from '@angular/router';

import { RouteParamEnum } from '../models/route-param.enum';
import { getParam } from '../shared/utils/get-param';

@Injectable({ providedIn: 'root' })
export class MonthGuard implements CanActivate {
  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    let year = getParam(route, RouteParamEnum.year)!;
    let month = getParam(route, RouteParamEnum.month)!;
    const yearValid = year > 0;
    const monthValid = month >= 1 && month <= 12;
    if (yearValid && monthValid) {
      return true;
    }
    const date = new Date();
    if (!yearValid) {
      year = date.getFullYear();
    }
    if (!monthValid) {
      month = date.getMonth() + 1;
    }
    return createUrlTreeFromSnapshot(route, ['../../../', year, 'month', month]);
  }
  
}
