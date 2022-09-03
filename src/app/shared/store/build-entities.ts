import { EntitiesRef, EntitiesState, getEntityType, getIdType } from '@ngneat/elf-entities';

export function buildEntities<S extends EntitiesState<Ref>, Ref extends EntitiesRef>(
  entities: getEntityType<S, Ref>[],
  idKey: string
): { newIds: getIdType<S, Ref>[]; newEntitiesObject: getEntityType<S, Ref> } {
  const newEntitiesObject = {} as Record<getIdType<S, Ref>, getEntityType<S, Ref>>;
  const newIds: getIdType<S, Ref>[] = [];

  for (const entity of entities) {
    const id: getIdType<S, Ref> = entity[idKey];
    newIds.push(id);
    newEntitiesObject[id] = entity;
  }

  return { newIds, newEntitiesObject };
}
