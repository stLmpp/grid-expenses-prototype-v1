import { EntitiesRef } from '@ngneat/elf-entities';

export interface BaseEntityOptions<Ref extends EntitiesRef> {
  ref?: Ref;
}
