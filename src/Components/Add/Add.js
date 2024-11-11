const { ipcRenderer } = window.require('electron');
import React, { useState } from 'react';
import styles from './Add.module.css';

const Add = ({ pageTitle }) => {
    const [files, setFiles] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [draggingIndex, setDraggingIndex] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(15);

    // Handle file selection through drag-and-drop or file input
    const handleFileInput = (event) => {
        const newFiles = event.target.files ? Array.from(event.target.files) : [];
        const newFileData = newFiles.map(file => ({ file, checked: false }));
        setFiles((prevFiles) => [...prevFiles, ...newFileData]);
    };
    
    const handleDrop = (event) => {
        event.preventDefault();
        const newFiles = event.dataTransfer?.files ? Array.from(event.dataTransfer.files) : [];
        const newFileData = newFiles.map(file => ({ file, checked: false }));
        setFiles((prevFiles) => [...prevFiles, ...newFileData]);
    };

    const handleDragOver = (event) => {
        event.preventDefault();
    };

    // Sort files based on selected column
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });

        const sortedFiles = [...files].sort((a, b) => {
            if (a.file[key] < b.file[key]) return direction === 'asc' ? -1 : 1;
            if (a.file[key] > b.file[key]) return direction === 'asc' ? 1 : -1;
            return 0;
        });
        setFiles(sortedFiles);
    };

    // Handle row dragging
    const handleDragStart = (index) => {
        setDraggingIndex(index);
    };

    const handleDragEnter = (index) => {
        if (draggingIndex === null) return;
        const newFiles = [...files];
        const [movedFile] = newFiles.splice(draggingIndex, 1);
        newFiles.splice(index, 0, movedFile);
        setDraggingIndex(index);
        setFiles(newFiles);
    };

    // Toggle checkbox
    const toggleCheckbox = (index) => {
        setFiles(files.map((item, i) => (i === index ? { ...item, checked: !item.checked } : item)));
    };

    // Pagination controls
    const totalPages = Math.ceil(files.length / rowsPerPage);
    const currentFiles = files.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const handleNextPage = () => {
        setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
    };

    const handlePrevPage = () => {
        setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
    };

    const handleRowsPerPageChange = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setCurrentPage(1); // Reset to the first page when rows per page changes
    };

    return (
        <div className={styles.container}>
            <h1>{pageTitle || 'New Project'}</h1>

            {/* Drag-and-drop area */}
            <div
                className={styles.dropZone}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                <p>Drag & Drop files here, or</p>
                <input
                    type="file"
                    multiple
                    onChange={handleFileInput}
                    className={styles.fileInput}
                />
                <button onClick={() => document.querySelector(`.${styles.fileInput}`).click()} className={styles.chooseButton}>
                    Choose Files
                </button>
            </div>

            {/* Files Table with Pagination */}
            {files.length > 0 && (
                <div className={styles.tableContainer}>
                    <div className={styles.paginationControls}>
                        <label>
                            Rows per page:
                            <select value={rowsPerPage} onChange={handleRowsPerPageChange} className={styles.rowsPerPageSelect}>
                                <option value={10}>10</option>
                                <option value={15}>15</option>
                                <option value={20}>20</option>
                            </select>
                        </label>
                        <button onClick={handlePrevPage} disabled={currentPage === 1} className={styles.paginationButton}>
                            Previous
                        </button>
                        <span>Page {currentPage} of {totalPages}</span>
                        <button onClick={handleNextPage} disabled={currentPage === totalPages} className={styles.paginationButton}>
                            Next
                        </button>
                    </div>
                    <table className={styles.fileTable}>
                        <thead>
                            <tr>
                                <th><input type="checkbox" disabled /></th>
                                <th onClick={() => handleSort('name')}>File Name</th>
                                <th onClick={() => handleSort('type')}>File Type</th>
                                <th onClick={() => handleSort('size')}>File Size (KB)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentFiles.map((item, index) => (
                                <tr
                                    key={index}
                                    draggable
                                    onDragStart={() => handleDragStart(index)}
                                    onDragEnter={() => handleDragEnter(index)}
                                    className={styles.draggableRow}
                                >
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={item.checked}
                                            onChange={() => toggleCheckbox(index)}
                                        />
                                    </td>
                                    <td>{item.file.name}</td>
                                    <td>{item.file.type || 'Unknown'}</td>
                                    <td>{(item.file.size / 1024).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Add;
