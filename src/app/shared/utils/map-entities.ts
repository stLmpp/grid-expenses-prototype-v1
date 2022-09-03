import { Reducer } from '@ngneat/elf';
import { DefaultEntitiesRef, EntitiesRef, EntitiesState, getEntityType, getIdType } from '@ngneat/elf-entities';

import { BaseEntityOptions } from './base-entity-options';
import { defaultEntitiesRef } from './default-entities-ref';

export function mapEntities<S extends EntitiesState<Ref>, Ref extends EntitiesRef = DefaultEntitiesRef>(
  update: (entities: getEntityType<S, Ref>[]) => getEntityType<S, Ref>[],
  options: BaseEntityOptions<Ref> = {}
): Reducer<S> {
  return (state) => {
    const { ref: { entitiesKey, idsKey } = defaultEntitiesRef } = options;
    const ids: getIdType<S, Ref>[] = state[idsKey];
    const entities = ids.map((id) => state[entitiesKey][id]);
    const updatedEntities = {} as Record<getIdType<S, Ref>, getEntityType<S, Ref>>;
    for (let index = 0; index < ids.length; index++) {
      updatedEntities[ids[index]] = entities[index];
    }
    return {
      ...state,
      [entitiesKey]: updatedEntities,
    };
  };
}
