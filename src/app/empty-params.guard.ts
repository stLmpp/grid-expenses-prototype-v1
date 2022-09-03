import { inject, Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class EmptyParamsGuard implements CanActivate {
  private readonly _router = inject(Router);

  canActivate(): UrlTree {
    const date = new Date();
    return this._router.createUrlTree(['/', 'year', date.getFullYear(), 'month', date.getMonth() + 1]);
  }
}
