import { Query } from '@ngneat/elf';
import { DefaultEntitiesRef, EntitiesRef, EntitiesState, getEntityType } from '@ngneat/elf-entities';

import { BaseEntityOptions } from './base-entity-options';
import { defaultEntitiesRef } from './default-entities-ref';

export function getEntitiesFiltered<
  S extends EntitiesState<Ref>,
  Ref extends EntitiesRef = DefaultEntitiesRef,
  R = getEntityType<S, Ref>
>(filterFn: (entity: getEntityType<S, Ref>) => entity is R, options?: BaseEntityOptions<Ref>): Query<S, R[]>;
export function getEntitiesFiltered<
  S extends EntitiesState<Ref>,
  Ref extends EntitiesRef = DefaultEntitiesRef,
  R = getEntityType<S, Ref>
>(filterFn: (entity: getEntityType<S, Ref>) => unknown, options?: BaseEntityOptions<Ref>): Query<S, R[]>;
export function getEntitiesFiltered<
  S extends EntitiesState<Ref>,
  Ref extends EntitiesRef = DefaultEntitiesRef,
  R = getEntityType<S, Ref>
>(filterFn: (entity: getEntityType<S, Ref>) => unknown, options: BaseEntityOptions<Ref> = {}): Query<S, R[]> {
  const { ref: { entitiesKey, idsKey } = defaultEntitiesRef } = options;

  return function (state) {
    const result = [];

    for (const id of state[idsKey]) {
      const entity = state[entitiesKey][id];
      if (filterFn(entity)) {
        result.push(entity);
      }
    }

    return result;
  };
}
