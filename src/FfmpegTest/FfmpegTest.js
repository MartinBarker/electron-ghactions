import React, { useState } from 'react';
const { ipcRenderer } = window.require('electron');
import styles from './FfmpegTest.module.css';

const FfmpegTest = () => {
  const [files, setFiles] = useState([]);

  const handleFileUpload = (event) => {
    const newFiles = Array.from(event.target.files);
    setFiles((prevFiles) => [...prevFiles, ...newFiles]);
  };

  const handleRemoveFile = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const renderFfmpegVideo = () => {
    const filePaths = files.map((file) => file.path);
    ipcRenderer.send('render-ffmpeg-video', filePaths);
  };

  return (
    <div className={styles.container}>
      <h1>FFmpeg File Renderer</h1>
      <input
        type="file"
        multiple
        onChange={handleFileUpload}
        className={styles.fileInput}
      />
      <ul className={styles.fileList}>
        {files.map((file, index) => (
          <li key={index} className={styles.fileItem}>
            {file.name}
            <button
              className={styles.removeButton}
              onClick={() => handleRemoveFile(index)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      {files.length > 0 && (
        <button
          className={styles.renderButton}
          onClick={renderFfmpegVideo}
        >
          Render FFmpeg Video
        </button>
      )}
    </div>
  );
};

export default FfmpegTest;
