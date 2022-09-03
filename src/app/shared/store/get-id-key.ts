import { ReducerContext } from '@ngneat/elf';
import { EntitiesRef } from '@ngneat/elf-entities';

export function getIdKey<T>(context: ReducerContext, ref: EntitiesRef): T {
  return context.config[ref.idKeyRef];
}
