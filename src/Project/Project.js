import React, { useState } from 'react';
import styles from './Project.module.css';
import FileUploader from '../FileUploader/FileUploader.js';

function ffmpegTest() {
  console.log('Running FFmpeg command');
  window.api.send('run-ffmpeg-command', ['-help']);

  window.api.receive('ffmpeg-output', (output) => {
    console.log('output =', output);
    document.getElementById('output').innerText = output;
  });

  window.api.receive('ffmpeg-error', (error) => {
    document.getElementById('error').innerText = error;
  });
}

function Project() {
  const [audioFiles, setAudioFiles] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);

  const handleFilesSelect = (audioData, imageData) => {
    console.log('' + audioData.length + ' audio files and ' + imageData.length + ' image files selected');
    setAudioFiles((prev) => [...prev, ...audioData]);
    setImageFiles((prev) => [...prev, ...imageData]);
  };

  return (
    <div className={styles.projectContainer}>
      <h1>Project</h1>
      <button onClick={ffmpegTest}>Run FFmpeg Help</button>
      <div id="output"></div>
      <div id="error" style={{ color: 'red' }}></div>

      {/* File Uploader */}
      <FileUploader onFilesSelect={handleFilesSelect} />

      {/* Audio Files */}
      <h2>Audio Files</h2>
      <ul>
        {audioFiles.map((file, index) => (
          <li key={index}>
            {file.fileName} - {file.durationDisplay}
          </li>
        ))}
      </ul>

      {/* Image Files */}
      <h2>Image Files</h2>
      <ul>
        {imageFiles.map((file, index) => (
          <li key={index}>
            {file.fileName} - {file.dimensions}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Project;
