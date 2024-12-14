// https://tanstack.com/table/v8/docs/framework/react/examples/row-selection

import React from 'react';
import {
    ColumnDef,
    getCoreRowModel,
    useReactTable,
    flexRender,
} from '@tanstack/react-table';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import styles from './Table.module.css';

// Drag handle for rows
function DragHandle({ rowId }) {
    const { attributes, listeners } = useSortable({ id: rowId });

    return (
        <button
            {...attributes}
            {...listeners}
            className={styles.dragHandle}
            title="Drag to reorder"
        >
            🟰
        </button>
    );
}

// Row Component
function Row({ row }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: row.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <tr ref={setNodeRef} style={style} {...attributes} {...listeners} className={styles.row}>
            {row.getVisibleCells().map((cell, index) => (
                <td key={cell.id} className={styles.cell}>
                    {index === 0 ? <DragHandle rowId={row.id} /> : null}
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
            ))}

        </tr>
    );
}

// Table Component
function Table({ data, setData, columns }) {

    const tableColumns = React.useMemo(() => [
        ...columns
    ], [columns]);

    const table = useReactTable({
        data,
        columns: tableColumns,
        getCoreRowModel: getCoreRowModel(),
    });

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (!active?.id || !over?.id || active.id === over.id) {
            return;
        }

        setData((oldData) => {
            const oldIndex = oldData.findIndex((row) => row.id === active.id);
            const newIndex = oldData.findIndex((row) => row.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                return arrayMove(oldData, oldIndex, newIndex);
            }

            return oldData;
        });
    };

    return (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={data.map(row => row.id)} strategy={verticalListSortingStrategy}>
                <table className={styles.table}>
                    <thead>
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id} className={styles.headerRow}>
                                {headerGroup.headers.map(header => (
                                    <th key={header.id} className={styles.headerCell}>
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map(row => (
                            <Row key={row.id} row={row} />
                        ))}
                    </tbody>
                </table>
            </SortableContext>
        </DndContext>
    );
}

export default Table;
