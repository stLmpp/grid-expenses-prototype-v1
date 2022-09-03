import { Reducer } from '@ngneat/elf';
import { DefaultEntitiesRef, EntitiesRef, EntitiesState, getEntityType, getIdType } from '@ngneat/elf-entities';

import { BaseEntityOptions } from './base-entity-options';
import { buildEntities } from './build-entities';
import { defaultEntitiesRef } from './default-entities-ref';
import { getIdKey } from './get-id-key';

export function mapEntities<S extends EntitiesState<Ref>, Ref extends EntitiesRef = DefaultEntitiesRef>(
  update: (entities: getEntityType<S, Ref>[]) => getEntityType<S, Ref>[],
  options: BaseEntityOptions<Ref> = {}
): Reducer<S> {
  return (state, context) => {
    const { ref = defaultEntitiesRef } = options;
    const { entitiesKey, idsKey } = ref;
    const ids: getIdType<S, Ref>[] = state[idsKey];
    const entities = update(ids.map((id) => state[entitiesKey][id]));
    const idKey = getIdKey<any>(context, ref);
    const { newIds, newEntitiesObject } = buildEntities(entities, idKey);
    return {
      ...state,
      [idsKey]: newIds,
      [entitiesKey]: newEntitiesObject,
    };
  };
}
