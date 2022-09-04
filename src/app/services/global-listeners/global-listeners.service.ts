import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { fromEvent, map, Observable, share } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GlobalListenersService {
  private readonly _document = inject(DOCUMENT);

  readonly documentKeydown$: Observable<KeyboardEvent> = fromEvent(this._document.documentElement, 'keydown').pipe(
    map((event) => event as KeyboardEvent),
    share()
  );
}
