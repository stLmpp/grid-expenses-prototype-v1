export function findDifferenceIndexBy<T extends Record<any, any>, K extends keyof T>(
  arrayA: T[] | null | undefined,
  arrayB: T[] | null | undefined,
  key: K
): number[] {
  if (!arrayA || !arrayB) {
    return [];
  }
  const indices: number[] = [];
  for (let index = 0; index < arrayA.length; index++) {
    const itemA = arrayA[index];
    if (!arrayB.some((itemB) => itemA[key] === itemB[key])) {
      indices.push(index);
    }
  }
  return indices;
}
