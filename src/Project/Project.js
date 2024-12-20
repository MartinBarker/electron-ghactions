import React, { useState, useEffect } from 'react';
import styles from './Project.module.css';
import FileUploader from '../FileUploader/FileUploader.js';
import Table from '../Table/Table.js';
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

  const [audioRowSelection, setAudioRowSelection] = useState({});
  const [imageRowSelection, setImageRowSelection] = useState({});

  useEffect(() => {
    localStorage.setItem('audioFiles', JSON.stringify(audioFiles));
    localStorage.setItem('imageFiles', JSON.stringify(imageFiles));
  }, [audioFiles, imageFiles]);

  const generateUniqueId = () => {
    return `id-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  };

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
              id: generateUniqueId(),
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
              id: generateUniqueId(),
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

  const getSelectedAudioRows = () => {
    const selectedRows = audioFiles.filter((file) => audioRowSelection[file.id]);
  
    alert(
      selectedRows
        .map((row) => `${row.fileName} (${row.duration})`)
        .join('\n') || 'No audio rows selected'
    );
  };
  
  const getSelectedImageRows = () => {
    const selectedRows = imageFiles.filter((file) => imageRowSelection[file.id]);
  
    alert(
      selectedRows
        .map((row) => `${row.fileName} (${row.dimensions || 'No dimensions'})`)
        .join('\n') || 'No image rows selected'
    );
  };
  

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

  return (
    <div className={styles.projectContainer}>
      <div className={styles.header}>
        <h1 className={styles.projectTitle}>New Project</h1>
        <button className={styles.refreshButton} onClick={clearComponent}>
          Clear
        </button>
      </div>

      <FileUploader onFilesSelect={handleFilesSelect} />

      <br /><h2>Audio Files</h2>
      <Table
        data={audioFiles}
        rowSelection={audioRowSelection}
        setRowSelection={setAudioRowSelection}
        setData={setAudioFiles}
        columns={audioColumns}
      />
      <button onClick={getSelectedAudioRows}>Get All Selected Audio Rows</button>

      <br /><h2>Image Files</h2>
      <Table
        data={imageFiles}
        rowSelection={imageRowSelection}
        setRowSelection={setImageRowSelection}
        setData={setImageFiles}
        columns={imageColumns}
      />
      <button onClick={getSelectedImageRows}>Get All Selected Image Rows</button>

      <br />
      <button onClick={clearComponent}>Render</button>
    </div>
  );
}

export default Project;