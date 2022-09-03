import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';

import { RouteParamEnum } from '../../models/route-param.enum';

interface GetParamOptions {
  raw?: boolean;
}

export function getParam(activatedRoute: ActivatedRoute | ActivatedRouteSnapshot, param: RouteParamEnum): number | null;
export function getParam(
  activatedRoute: ActivatedRoute | ActivatedRouteSnapshot,
  param: RouteParamEnum,
  options: { raw: true }
): string | null;
export function getParam(
  activatedRoute: ActivatedRoute | ActivatedRouteSnapshot,
  param: RouteParamEnum,
  options?: GetParamOptions
): string | number | null {
  const snapshot = activatedRoute instanceof ActivatedRouteSnapshot ? activatedRoute : activatedRoute.snapshot;
  let paramValue: string | number | null = snapshot.paramMap.get(param);
  if (!options?.raw) {
    paramValue = paramValue && Number(paramValue);
  }
  return paramValue;
}
