import React, { useState, useEffect } from 'react';
import styles from './Project.module.css';
import FileUploader from '../FileUploader/FileUploader.js';
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
            updatedFiles.push({ ...newFile, duration: 'Loading...' });
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
            updatedImages.push(newImage);
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

  return (
    <div className={styles.projectContainer}>
      <div className={styles.header}>
        <h1 className={styles.projectTitle}>Project</h1>
        <button className={styles.refreshButton} onClick={clearComponent}>
          Clear
        </button>
      </div>

      <FileUploader onFilesSelect={handleFilesSelect} />

      <h2>Audio Files</h2>
      <ul>
        {audioFiles.map((file, index) => (
          <li key={index}>
            {file.fileName} - {formatDuration(file.duration)}
          </li>
        ))}
      </ul>

      <h2>Image Files</h2>
      <ul>
        {imageFiles.map((file, index) => (
          <li key={index}>
            {file.fileName} - {file.dimensions || 'Loading...'}
          </li>
        ))}
      </ul>

      <button onClick={startRender}>Render</button>
    </div>
  );
}

export default Project;
