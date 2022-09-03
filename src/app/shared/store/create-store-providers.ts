import { Type } from '@angular/core';
import { Store, StoreValue } from '@ngneat/elf';
import { stateHistory } from '@ngneat/elf-state-history';
import { StateHistory } from '@ngneat/elf-state-history/lib/state-history';

export function createStoreProviders<S extends Store, State extends StoreValue<S>, E extends Record<string, any>>(
  store: S,
  extra?: E
): { Base: Type<S & { history: StateHistory<S, State> } & E>; useFactory: () => S } {
  class StoreClass {}
  Object.defineProperty(StoreClass, 'name', { value: store.name });
  const useFactory = (): S => Object.assign(store, { history: stateHistory(store), ...extra });
  return { Base: StoreClass as Type<S & { history: StateHistory<S, State> } & E>, useFactory };
}
