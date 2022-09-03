import { inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map, Observable, shareReplay } from 'rxjs';

import { RouteParamEnum } from '../../models/route-param.enum';

import { filterNil } from './filter-nil';

interface SelectParamOptions {
  raw?: boolean;
  nonNullable?: boolean;
}

export function selectParam(param: RouteParamEnum): Observable<number | null>;
export function selectParam(param: RouteParamEnum, options: { nonNullable: true }): Observable<number>;
export function selectParam(param: RouteParamEnum, options: { raw: true }): Observable<string | null>;
export function selectParam(param: RouteParamEnum, options: { raw: true; nonNullable: true }): Observable<string>;
export function selectParam(param: RouteParamEnum, options?: SelectParamOptions): Observable<string | number | null> {
  const activatedRoute = inject(ActivatedRoute);
  let param$: Observable<string | number | null> = activatedRoute.paramMap.pipe(map((paramMap) => paramMap.get(param)));
  if (options?.nonNullable) {
    param$ = param$.pipe(filterNil());
  }
  if (!options?.raw) {
    param$ = param$.pipe(map(Number));
  }
  return param$.pipe(shareReplay());
}
