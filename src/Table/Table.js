// Table.js
import React, { useState } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import styles from "./Table.module.css";

// Indeterminate Checkbox Component
function IndeterminateCheckbox({ indeterminate, className = "", ...rest }) {
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (typeof indeterminate === "boolean") {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      type="checkbox"
      ref={ref}
      className={`${styles.checkbox} ${className}`}
      {...rest}
    />
  );
}

function DragHandle({ row, rowIndex }) {
  const { attributes, listeners } = useSortable({ id: row.original.id });

  return (
    <div className={styles.dragHandleWrapper}>
      <button
        {...attributes}
        {...listeners}
        className={styles.dragHandle}
        title="Drag to reorder"
      >
        ☰
      </button>
      <span className={styles.rowNumber}>{rowIndex + 1}</span>
    </div>
  );
}

function Row({
  row,
  rowIndex,
  toggleRowExpanded,
  isExpanded,
  toggleRowSelected,
  removeRow,
}) {
  const { setNodeRef, transform, transition } = useSortable({
    id: row.original.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <>
      <tr
        ref={setNodeRef}
        style={style}
        className={styles.row}
        onClick={() => toggleRowSelected(row.id)}
      >
        {row.getVisibleCells().map((cell) => {
          const columnHeader = cell.column.columnDef.header;

          return (
            <td
              key={cell.id}
              className={styles.cell}
              data-tooltip={cell.getValue()}
            >
              {/* Render Drag handle */}
              {columnHeader === "Drag" && (
                <DragHandle row={row} rowIndex={rowIndex} />
              )}

              {/* Render Expand Icon */}
              {columnHeader === "Expand" && (
                <span
                  className={`${styles.expandIcon} ${
                    isExpanded ? styles.expanded : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRowExpanded(row.id);
                  }}
                  title="Expand/Collapse Row"
                >
                  {isExpanded ? "▽" : "▷"}
                </span>
              )}

              {/* Render Remove Button */}
              {columnHeader === "Remove" && (
                <button
                  className={styles.removeButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRow(row.id);
                  }}
                  title="Remove this file"
                >
                  ❌
                </button>
              )}

              {/* Render other cells */}
              {columnHeader !== "Expand" &&
                columnHeader !== "Drag" &&
                columnHeader !== "Remove" &&
                flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          );
        })}
      </tr>
      {isExpanded && (
        <tr className={styles.expandedRow}>
          <td colSpan={row.getVisibleCells().length}>
            <div className={styles.expandedContent}>
              <label>
                Start Time:
                <input type="text" placeholder="00:00" />
              </label>
              <label>
                End Time:
                <input type="text" placeholder="00:00" />
              </label>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function Table({ data, setData, columns, rowSelection, setRowSelection }) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRowSelected = (rowId) => {
    setRowSelection((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  };

  const toggleRowExpanded = (rowId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  };

  const removeRow = (rowId) => {
    setData((prev) => {
      const updated = prev.filter((row) => row.id !== rowId);
      localStorage.setItem("audioFiles", JSON.stringify(updated));
      return updated;
    });
  };

  const tableColumns = React.useMemo(() => [
    {
      id: "select",
      header: ({ table }) => (
        <IndeterminateCheckbox
          {...{
            checked: table.getIsAllRowsSelected(),
            indeterminate: table.getIsSomeRowsSelected(),
            onChange: table.getToggleAllRowsSelectedHandler(),
          }}
        />
      ),
      cell: ({ row }) => (
        <div className="px-1">
          <IndeterminateCheckbox
            {...{
              checked: row.getIsSelected(),
              disabled: !row.getCanSelect(),
              indeterminate: row.getIsSomeSelected(),
              onChange: row.getToggleSelectedHandler(),
            }}
          />
        </div>
      ),
    },
    {
      id: "expand",
      header: "Expand",
      cell: () => null,
    },
    {
      id: "drag",
      header: "Drag",
      cell: () => null,
    },
    ...columns.map((column) => ({
      ...column,
      header: () => (
        <div
          className={styles.sortableHeader}
          onClick={() => {
            const isSorted = sorting.find((sort) => sort.id === column.accessorKey);
            const direction = isSorted ? (isSorted.desc ? 'asc' : 'desc') : 'asc';
            setSorting([{ id: column.accessorKey, desc: direction === 'desc' }]);
          }}
        >
          {column.header || ""}
          <span className={styles.sortIcon}>
            {sorting.find((sort) => sort.id === column.accessorKey)?.desc ? "🔽" : "🔼"}
          </span>
        </div>
      ),
    })),
    {
      id: "remove",
      header: "Remove",
      cell: () => null,
    },
  ]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { sorting },
    getRowId: (row) => row.id,
    state: { rowSelection, globalFilter, sorting },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active && over && active.id !== over.id) {
      const oldIndex = data.findIndex((item) => item.id === active.id);
      const newIndex = data.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newData = arrayMove([...data], oldIndex, newIndex);
        setData(newData);
        localStorage.setItem("audioFiles", JSON.stringify(newData));
      }
    }
  };

  return (
    <div>
      <input
        type="text"
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        placeholder="Search..."
        className={styles.search}
      />
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={data.map((row) => row.id)}
          strategy={verticalListSortingStrategy}
        >
          <table className={styles.table}>
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className={styles.headerRow}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className={styles.headerCell}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, rowIndex) => (
                <Row
                  key={row.original.id}
                  row={row}
                  rowIndex={rowIndex}
                  toggleRowSelected={toggleRowSelected}
                  toggleRowExpanded={toggleRowExpanded}
                  isExpanded={!!expandedRows[row.id]}
                  removeRow={removeRow}
                />
              ))}
            </tbody>
          </table>
        </SortableContext>
        <div className={styles.pagination}>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </button>
          <span>
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </button>
        </div>
      </DndContext>
      <div className={styles.footer}>
        <span>
          {Object.keys(rowSelection).length} of {data.length} rows selected
        </span>
      </div>
    </div>
  );
}

export default Table;
