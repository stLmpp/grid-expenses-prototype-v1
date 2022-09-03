import { GridApi } from '@ag-grid-community/core';

export function isRangeSingleRow(api: GridApi): boolean {
  const range = api.getCellRanges();
  return (
    !!range && range.length === 1 && !!range[0].startRow && !!range[0].endRow && range[0].startRow === range[0].endRow
  );
}
