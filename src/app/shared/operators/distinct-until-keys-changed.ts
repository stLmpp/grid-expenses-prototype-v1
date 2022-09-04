import { distinctUntilChanged, MonoTypeOperatorFunction } from 'rxjs';

export function distinctUntilKeysChanged<T extends Record<string, any>, K extends keyof T>(
  keys: K[],
  comparator: (valueA: T[K], valueB: T[K]) => boolean = Object.is
): MonoTypeOperatorFunction<T> {
  return distinctUntilChanged((valueA, valueB) => {
    let index = keys.length;
    while (index--) {
      const key = keys[index];
      if (!comparator(valueA[key], valueB[key])) {
        return false;
      }
    }
    return true;
  });
}
