import * as React from "react";

export type SortDir = "asc" | "desc";
export interface DataTableSort { key: string; dir: SortDir; }

export interface DataTableColumn<Row = any> {
  /** Stable identifier for the column (used for sort/visibility state). */
  key: string;
  header: React.ReactNode;
  /** Field on the row to read when no `render` is given. Defaults to `key`. */
  field?: string;
  /** Custom cell renderer — drop a HealthBadge / StageBadge / formatted value here. */
  render?: (row: Row) => React.ReactNode;
  sortable?: boolean;
  /** Value used for sorting; defaults to row[field ?? key]. */
  sortAccessor?: (row: Row) => string | number | Date | null | undefined;
  align?: "left" | "right" | "center";
  /** Render the cell in JetBrains Mono with tabular numerals (for numbers). */
  mono?: boolean;
  width?: string | number;
  /** Show this column in the column chooser. */
  hideable?: boolean;
  defaultHidden?: boolean;
  headerTitle?: string;
}

export interface DataTableProps<Row = any> extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  /** @default (row) => row.id */
  getRowId?: (row: Row) => string | number;

  selectable?: boolean;
  /** Controlled selection. Omit for uncontrolled. */
  selectedIds?: (string | number)[];
  onSelectionChange?: (ids: (string | number)[]) => void;

  defaultSort?: DataTableSort | null;
  /** Controlled sort. Omit for uncontrolled. */
  sort?: DataTableSort | null;
  onSortChange?: (sort: DataTableSort) => void;
  /** True when the consumer sorts the rows itself (e.g. server-side). */
  manualSort?: boolean;

  hiddenColumns?: string[];
  onHiddenColumnsChange?: (keys: string[]) => void;
  showColumnChooser?: boolean;

  onRowClick?: (row: Row) => void;
  stickyHeader?: boolean;

  title?: React.ReactNode;
  /** Left-side toolbar slot (filters / search) shown when nothing is selected. */
  toolbar?: React.ReactNode;
  /** Replaces the toolbar slot when rows are selected (e.g. "Apply a Playbook"). */
  selectionActions?: React.ReactNode;
  empty?: React.ReactNode;
  dense?: boolean;
}

export function DataTable<Row = any>(props: DataTableProps<Row>): JSX.Element;
