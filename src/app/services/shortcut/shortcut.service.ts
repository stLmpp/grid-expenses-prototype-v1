import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ShortcutService {
  private _isMac = false;

  setIsMac(isMac: boolean): void {
    this._isMac = isMac;
  }

  checkForCtrlOrCommand(event: KeyboardEvent): boolean {
    return this._isMac ? event.metaKey : event.ctrlKey;
  }

  checkForAltOrCommand(event: KeyboardEvent): boolean {
    return this._isMac ? event.metaKey : event.altKey;
  }

  getCtrlOrCommandSymbol(): string {
    return this._isMac ? '⌘' : 'Ctrl';
  }

  getAltOrCommandSymbol(): string {
    return this._isMac ? '⌘' : 'Alt';
  }
}
