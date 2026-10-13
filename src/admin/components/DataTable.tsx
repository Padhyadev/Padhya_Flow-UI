import React, { useState } from 'react';
import '../styles/admin-components.css';
import '../styles/table.css';

export interface Column<T = any> {
    key: string;
    label: string;
    sortable?: boolean;
    align?: 'left' | 'center' | 'right';
    width?: string; // e.g., '80px', '150px', '20%', 'auto'
    render?: (value: any, row: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T = any> {
    columns: Column<T>[];
    data: T[];
    onEdit?: (row: T) => void;
    onDelete?: (row: T) => void;
    onView?: (row: T) => void;
    customActions?: (row: T) => React.ReactNode;
    loading?: boolean;
    emptyMessage?: string;
    keyField?: string;
}

export default function DataTable<T = any>({
    columns,
    data,
    onEdit,
    onDelete,
    onView,
    customActions,
    loading = false,
    emptyMessage = 'No data available',
    keyField = 'id'
}: DataTableProps<T>) {
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [hoverRow, setHoverRow] = useState<number | null>(null);

    const handleSort = (columnKey: string) => {
        if (sortColumn === columnKey) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(columnKey);
            setSortDirection('asc');
        }
    };

    const sortedData = React.useMemo(() => {
        if (!sortColumn) return data;

        return [...data].sort((a, b) => {
            const aValue = (a as any)[sortColumn];
            const bValue = (b as any)[sortColumn];

            if (aValue === bValue) return 0;

            const comparison = aValue > bValue ? 1 : -1;
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [data, sortColumn, sortDirection]);

    if (loading) {
        return (
            <div className="admin-table-loading">
                <i className="fa-solid fa-spinner fa-spin"></i>
                <p>Loading...</p>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="admin-table-empty">
                <i className="fa-solid fa-folder-open"></i>
                <p>{emptyMessage}</p>
            </div>
        );
    }



    return (
        <div style={{ width: '100%', overflowX: 'auto', background: 'white' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '14px' }}>
                <thead>
                    <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                onClick={() => column.sortable && handleSort(column.key)}
                                style={{
                                    padding: '14px 16px',
                                    textAlign: 'left',
                                    fontWeight: 600,
                                    color: '#495057',
                                    fontSize: '13px',
                                    letterSpacing: '0.3px',
                                    whiteSpace: 'nowrap',
                                    borderBottom: '2px solid #dee2e6',
                                    verticalAlign: 'middle',
                                    cursor: column.sortable ? 'pointer' : 'default',
                                    width: column.width || 'auto',
                                    userSelect: 'none'
                                }}
                            >
                                {column.label}
                                {column.sortable && sortColumn === column.key && (
                                    <i
                                        className={`fa-solid fa-sort-${sortDirection === 'asc' ? 'up' : 'down'}`}
                                        style={{ marginLeft: '6px', fontSize: '11px', color: 'var(--admin-primary)' }}
                                    ></i>
                                )}
                            </th>
                        ))}
                        {(onView || onEdit || onDelete || customActions) && (
                            <th style={{
                                padding: '14px 16px',
                                textAlign: 'left',
                                fontWeight: 600,
                                color: '#495057',
                                fontSize: '13px',
                                letterSpacing: '0.3px',
                                whiteSpace: 'nowrap',
                                borderBottom: '2px solid #dee2e6',
                                verticalAlign: 'middle',
                                width: '120px' // Reserved width for consistent layout
                            }}>
                                Action
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {sortedData.map((row, index) => (
                        <tr
                            key={(row as any)[keyField] || index}
                            style={{
                                borderBottom: index === sortedData.length - 1 ? 'none' : '1px solid #f1f3f5',
                                transition: 'all 0.15s ease',
                                background: hoverRow === index ? '#f8f9fa' : 'transparent'
                            }}
                            onMouseEnter={() => setHoverRow(index)}
                            onMouseLeave={() => setHoverRow(null)}
                        >
                            {columns.map((column) => {
                                const cellValue = (row as any)[column.key];
                                // Debug: Log the value being accessed for each cell
                                if (column.key === 'totalDays' || column.key === 'chapterType') {
                                    console.log('📍 DataTable cell render - key:', column.key, 'value:', cellValue, 'row:', row);
                                }
                                return (
                                    <td
                                        key={column.key}
                                        style={{
                                            padding: '14px 16px',
                                            textAlign: 'left',
                                            color: column.key === 'id' ? '#212529' : '#495057',
                                            fontWeight: column.key === 'id' ? 600 : 400,
                                            fontSize: '14px',
                                            verticalAlign: 'middle',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}
                                    >
                                        {column.render
                                            ? column.render(cellValue, row, index)
                                            : cellValue}
                                    </td>
                                )
                            })}
                            {(onView || onEdit || onDelete || customActions) && (
                                <td style={{
                                    padding: '14px 16px',
                                    textAlign: 'left', // Strict Left Align
                                    color: '#495057',
                                    fontSize: '14px',
                                    verticalAlign: 'middle',
                                    whiteSpace: 'nowrap'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        justifyContent: 'flex-start' // Strict Left Align Flex Items
                                    }}>
                                        {onView && (
                                            <button
                                                className="admin-btn-icon admin-btn-info"
                                                onClick={() => onView(row)}
                                                title="View"
                                            >
                                                <i className="fa-solid fa-eye"></i>
                                            </button>
                                        )}
                                        {onEdit && (
                                            <button
                                                className="admin-btn-icon admin-btn-primary"
                                                onClick={() => onEdit(row)}
                                                title="Edit"
                                            >
                                                <i className="fa-solid fa-edit"></i>
                                            </button>
                                        )}
                                        {onDelete && (
                                            <button
                                                className="admin-btn-icon admin-btn-danger"
                                                onClick={() => onDelete(row)}
                                                title="Delete"
                                            >
                                                <i className="fa-solid fa-trash"></i>
                                            </button>
                                        )}
                                        {customActions && customActions(row)}
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
