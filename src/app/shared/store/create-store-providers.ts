import { Type } from '@angular/core';
import { Store, StoreValue } from '@ngneat/elf';
import { stateHistory } from '@ngneat/elf-state-history';
import { StateHistory } from '@ngneat/elf-state-history/lib/state-history';

import { mapEntities } from './map-entities';

export function createStoreProviders<S extends Store, E extends Record<string, any>>(
  store: S,
  options?: {
    history?: false;
    extra?: E;
  }
): { Base: Type<S & E>; useFactory: () => S };
export function createStoreProviders<S extends Store, State extends StoreValue<S>, E extends Record<string, any>>(
  store: S,
  options?: {
    history: true;
    extra?: E;
  }
): { Base: Type<S & { history: StateHistory<S, State> } & E>; useFactory: () => S };
export function createStoreProviders<S extends Store, State extends StoreValue<S>, E extends Record<string, any>>(
  store: S,
  options?: {
    history?: boolean;
    extra?: E;
  }
): { Base: Type<S & { history?: StateHistory<S, State> } & E>; useFactory: () => S } {
  class StoreClass {}
  Object.defineProperty(StoreClass, 'name', { value: store.name });

  const extendedStore: Record<string, any> & { history?: StateHistory<S, State> } = {
    ...options?.extra,
  };

  if (options?.history) {
    extendedStore.history = stateHistory(store, {
      maxAge: 100,
    });
  }

  const update = store.update;

  store.update = function (...args: any) {
    return update.call(
      this,
      ...args,
      mapEntities((entities) => entities.map((entity, index) => ({ ...entity, order: index })))
    );
  };

  const useFactory = (): S => Object.assign(store, extendedStore);
  return { Base: StoreClass as any, useFactory };
}
