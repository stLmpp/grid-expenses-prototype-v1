import { Injectable, ViewContainerRef } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

@Injectable({ providedIn: 'root' })
export class MatIconDynamicHtmlService {
  private readonly _cache = new Map<string, HTMLElement>();

  get(viewContainerRef: ViewContainerRef, fontIcon: string): HTMLElement {
    if (this._cache.has(fontIcon)) {
      return this._cache.get(fontIcon)!;
    }
    const icon = viewContainerRef.createComponent(MatIcon);
    icon.setInput('fontIcon', fontIcon);
    const element: HTMLElement = icon.location.nativeElement;
    element.classList.add('mat-icon-dynamic-ag-grid');
    element.setAttribute('fontIcon', fontIcon);
    const cloneElement = element.cloneNode() as HTMLElement;
    icon.destroy();
    this._cache.set(fontIcon, cloneElement);
    return cloneElement;
  }

  destroy(fontIcon: string): void {
    this._cache.get(fontIcon)?.remove();
    this._cache.delete(fontIcon);
  }
}
