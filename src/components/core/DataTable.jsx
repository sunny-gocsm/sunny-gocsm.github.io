import React, { useState } from "react";
import { Icon } from "../util/Icon.jsx";
import { Checkbox } from "./Checkbox.jsx";

function cmp(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (a instanceof Date || b instanceof Date) return new Date(a).getTime() - new Date(b).getTime();
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

function SortIcon({ dir }) {
  return (
    <span className="dt-sort">
      <Icon name={dir === "asc" ? "chevron-up" : dir === "desc" ? "chevron-down" : "chevrons-up-down"} />
    </span>
  );
}

/**
 * DataTable — the portfolio table behind "Accounts: the book". Sortable columns,
 * multi-select with select-all, a column chooser, custom cell renderers (drop a
 * HealthBadge / StageBadge straight into a cell via column.render), row click →
 * Account 360, sticky header, and an empty state. Sorting, selection, and column
 * visibility are uncontrolled by default and fully controllable. Numbers belong in
 * mono, right-aligned columns (align:"right", mono:true).
 */
export function DataTable({
  columns = [], rows = [], getRowId = (r) => r.id,
  selectable = false, selectedIds, onSelectionChange,
  defaultSort = null, sort, onSortChange, manualSort = false,
  hiddenColumns, onHiddenColumnsChange, showColumnChooser = true,
  onRowClick, stickyHeader = true,
  title, toolbar, selectionActions, empty = "No results", dense = false,
  ...rest
}) {
  const isSortCtrl = sort !== undefined;
  const [sortIn, setSortIn] = useState(defaultSort);
  const effSort = isSortCtrl ? sort : sortIn;
  const applySort = (next) => { if (!isSortCtrl) setSortIn(next); if (onSortChange) onSortChange(next); };

  const isSelCtrl = selectedIds !== undefined;
  const [selIn, setSelIn] = useState(() => new Set());
  const selSet = isSelCtrl ? new Set(selectedIds) : selIn;
  const emitSel = (next) => { if (!isSelCtrl) setSelIn(next); if (onSelectionChange) onSelectionChange([...next]); };

  const isHidCtrl = hiddenColumns !== undefined;
  const [hidIn, setHidIn] = useState(() => new Set(columns.filter((c) => c.defaultHidden).map((c) => c.key)));
  const hidSet = isHidCtrl ? new Set(hiddenColumns) : hidIn;
  const emitHid = (next) => { if (!isHidCtrl) setHidIn(next); if (onHiddenColumnsChange) onHiddenColumnsChange([...next]); };

  const [chooserOpen, setChooserOpen] = useState(false);

  const cols = columns.filter((c) => !hidSet.has(c.key));
  const colByKey = {};
  columns.forEach((c) => { colByKey[c.key] = c; });
  const hideable = columns.filter((c) => c.hideable);

  let view = rows;
  if (!manualSort && effSort && effSort.key && colByKey[effSort.key]) {
    const col = colByKey[effSort.key];
    const acc = col.sortAccessor || ((r) => r[col.field || col.key]);
    view = [...rows].sort((a, b) => { const v = cmp(acc(a), acc(b)); return effSort.dir === "desc" ? -v : v; });
  }

  const ids = view.map(getRowId);
  const selectedCount = selSet.size;
  const allSelected = ids.length > 0 && ids.every((id) => selSet.has(id));
  const someSelected = ids.some((id) => selSet.has(id)) && !allSelected;

  const toggleAll = () => {
    const next = new Set(selSet);
    if (allSelected) ids.forEach((id) => next.delete(id));
    else ids.forEach((id) => next.add(id));
    emitSel(next);
  };
  const toggleRow = (id) => { const next = new Set(selSet); if (next.has(id)) next.delete(id); else next.add(id); emitSel(next); };
  const toggleCol = (key) => { const next = new Set(hidSet); if (next.has(key)) next.delete(key); else next.add(key); emitHid(next); };
  const onHeaderSort = (col) => {
    if (!col.sortable) return;
    if (effSort && effSort.key === col.key) applySort({ key: col.key, dir: effSort.dir === "asc" ? "desc" : "asc" });
    else applySort({ key: col.key, dir: "asc" });
  };

  const spanAll = cols.length + (selectable ? 1 : 0);
  const showToolbar = title || toolbar || (selectable && selectedCount > 0) || (showColumnChooser && hideable.length > 0);

  return (
    <div className={["dt", dense ? "dense" : ""].filter(Boolean).join(" ")} {...rest}>
      {showToolbar ? (
        <div className="dt-toolbar">
          <div className="dt-toolbar-left">
            {selectable && selectedCount > 0
              ? <span className="dt-selcount"><span className="n">{selectedCount}</span> selected</span>
              : (title ? <div className="dt-title">{title}</div> : null)}
            {selectable && selectedCount > 0 ? selectionActions : toolbar}
          </div>
          {showColumnChooser && hideable.length ? (
            <div className="dt-chooser-wrap">
              <button type="button" className="dt-chooser" onClick={() => setChooserOpen((o) => !o)} aria-expanded={chooserOpen}>
                <Icon name="sliders-horizontal" />Columns
              </button>
              {chooserOpen ? (
                <div className="dt-chooser-menu">
                  {hideable.map((c) => (
                    <label key={c.key} className="dt-chooser-item">
                      <Checkbox checked={!hidSet.has(c.key)} onChange={() => toggleCol(c.key)} />
                      <span>{c.header}</span>
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="dt-scroll">
        <table className="dt-table">
          <thead className={["dt-head", stickyHeader ? "sticky" : ""].filter(Boolean).join(" ")}>
            <tr>
              {selectable ? (
                <th className="dt-th dt-th-check" scope="col">
                  <input
                    type="checkbox"
                    className="chk"
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all rows"
                  />
                </th>
              ) : null}
              {cols.map((col) => {
                const active = !!(effSort && effSort.key === col.key);
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={["dt-th", col.align || "left", col.sortable ? "sortable" : ""].filter(Boolean).join(" ")}
                    style={col.width ? { width: col.width } : undefined}
                    aria-sort={col.sortable ? (active ? (effSort.dir === "asc" ? "ascending" : "descending") : "none") : undefined}
                    onClick={col.sortable ? () => onHeaderSort(col) : undefined}
                    title={col.headerTitle}
                  >
                    <span className="dt-th-inner">
                      <span>{col.header}</span>
                      {col.sortable ? <SortIcon dir={active ? effSort.dir : null} /> : null}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {view.length === 0 ? (
              <tr><td className="dt-empty" colSpan={spanAll}>{empty}</td></tr>
            ) : view.map((row) => {
              const id = getRowId(row);
              const sel = selSet.has(id);
              return (
                <tr
                  key={id}
                  className={["dt-row", sel ? "selected" : "", onRowClick ? "clickable" : ""].filter(Boolean).join(" ")}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {selectable ? (
                    <td className="dt-td dt-td-check" onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={sel} onChange={() => toggleRow(id)} aria-label="Select row" />
                    </td>
                  ) : null}
                  {cols.map((col) => (
                    <td key={col.key} className={["dt-td", col.align || "left", col.mono ? "mono" : ""].filter(Boolean).join(" ")}>
                      {col.render ? col.render(row) : row[col.field || col.key]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
