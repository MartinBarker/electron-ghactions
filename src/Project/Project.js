import React, { useState, useEffect } from 'react';
import styles from './Project.module.css';
import FileUploader from '../FileUploader/FileUploader.js';
import Table from '../Table/Table.js';
import TableEx from '../Table/TableEx.js'
import { createFFmpegCommand } from '../FFmpeg/FFmpegUtils.js';

function formatDuration(duration) {
  if (!duration || duration === 'Loading...') return 'Loading...';
  const seconds = parseFloat(duration);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

function Project() {
  const [audioFiles, setAudioFiles] = useState(JSON.parse(localStorage.getItem('audioFiles')) || []);
  const [imageFiles, setImageFiles] = useState(JSON.parse(localStorage.getItem('imageFiles')) || []);

  useEffect(() => {
    localStorage.setItem('audioFiles', JSON.stringify(audioFiles));
    localStorage.setItem('imageFiles', JSON.stringify(imageFiles));
  }, [audioFiles, imageFiles]);

  const handleFilesSelect = (audioData, imageData) => {
    if (audioData.length) {
      setAudioFiles(prev => {
        const updatedFiles = prev.map(file => ({ ...file }));
        audioData.forEach(newFile => {
          const index = updatedFiles.findIndex(f => f.fileName === newFile.fileName);
          if (index >= 0) {
            updatedFiles[index] = { ...updatedFiles[index], ...newFile };
          } else {
            updatedFiles.push({
              ...newFile,
              id: generateUniqueId(), // Use custom unique ID generator
              duration: 'Loading...',
            });
          }
        });
        return updatedFiles;
      });
    }

    if (imageData.length) {
      setImageFiles(prev => {
        const updatedImages = prev.map(img => ({ ...img }));
        imageData.forEach(newImage => {
          const index = updatedImages.findIndex(img => img.fileName === newImage.fileName);
          if (index >= 0) {
            updatedImages[index] = { ...updatedImages[index], ...newImage };
          } else {
            updatedImages.push({
              ...newImage,
              id: generateUniqueId(), // Use custom unique ID generator
            });
          }
        });
        return updatedImages;
      });
    }
  };

  const clearComponent = () => {
    setAudioFiles([]);
    setImageFiles([]);
    localStorage.removeItem('audioFiles');
    localStorage.removeItem('imageFiles');
  };

  function startRender() {
    console.log9('startRender()');
    const configs = {
      input: 'input.mp4',
      output: 'output.mp4',
      options: {
        '-vf': 'scale=1280:720',
        '-crf': '23',
      },
    };

    const ffmpegCommand = createFFmpegCommand(configs);
    console.log('Generated FFmpeg Command:', ffmpegCommand);
  }

  const audioColumns = [
    { accessorKey: 'draggable', header: 'Drag' },
    { accessorKey: 'fileName', header: 'File Name' },
    { accessorKey: 'duration', header: 'Duration' },
  ];

  const imageColumns = [
    { accessorKey: 'draggable', header: 'Drag' },
    { accessorKey: 'fileName', header: 'File Name' },
    { accessorKey: 'dimensions', header: 'Dimensions' },
  ];

  // --------------------------------
  // TableEx data below
  const [testData, setTestData] = useState([
    { id: "a1", fileName: "Test Audio 1", duration: "2:30" },
    { id: "a2", fileName: "Test Audio 2", duration: "3:45" },
    { id: "a3", fileName: "Test Audio 3", duration: "4:15" },
    { id: "a4", fileName: "Test Audio 4", duration: "1:20" },
    { id: "a5", fileName: "Test Audio 5", duration: "2:50" },
    { id: "a6", fileName: "Test Audio 6", duration: "3:10" },
    { id: "a7", fileName: "Test Audio 7", duration: "4:00" },
  ]);

  const testColumns = [
    { accessorKey: "fileName", header: "File Name" },
    { accessorKey: "duration", header: "Duration" },
  ];

  const [rowSelection, setRowSelection] = useState({});

  // Get all selected rows from a table
  const getSelectedRows = () => {
    const selectedRows = Object.keys(rowSelection)
      .map((id) => testData.find((row) => row.id === id))
      .filter(Boolean); // Filters out undefined entries if any

    alert(
      selectedRows
        .map((row) => `${row.fileName} (${row.duration})`)
        .join("\n") || "No rows selected"
    );
  };

  // --------------------------------
  // Utility Functions below:
  const generateUniqueId = () => {
    return `id-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  };
  // ---------------------------------

  return (
    <div className={styles.projectContainer}>

      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.projectTitle}>New Project</h1>
        <button className={styles.refreshButton} onClick={clearComponent}>
          Clear
        </button>
      </div>

      {/* File Uploader */}
      <FileUploader onFilesSelect={handleFilesSelect} />

      {/* Audio Table */}
      <br/><h2>Audio Files</h2>
      <TableEx 
        data={audioFiles}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        setData={setAudioFiles}
        columns={audioColumns}
      />
      <button onClick={getSelectedRows}>Get All Selected Audio Rows</button>
      
      {/* Image Table */}
      <br/><h2>Image Files</h2>
      <TableEx 
        data={imageFiles}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        setData={setImageFiles}
        columns={imageColumns}
      />
      <button onClick={getSelectedRows}>Get All Selected Image Rows</button>
      
      {/* Render Options */}

      {/* Start Render Button */}
      <br/>
      <button onClick={startRender}>Render</button>

    </div>
  );
}

export default Project;
