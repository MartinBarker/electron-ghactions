import React, { useState } from "react";
import styles from './FileUploader.module.css';

const FileUploader = ({ onFilesSelect }) => {
  const [highlight, setHighlight] = useState(false);

  const handleDragOver = (event) => {
    event.preventDefault();
    if (!highlight) setHighlight(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    if (highlight) setHighlight(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setHighlight(false);
    const files = event.dataTransfer.files;
    processFiles(files);
  };

  const handleFileInputChange = async (event) => {
    const files = event.target.files;
    processFiles(files);
  };

  const getAudioDuration = async (file) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const fileArrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(fileArrayBuffer);
    return audioBuffer.duration.toFixed(2); // Rounded to two decimal places
  };

  const getImageDimensions = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(url);
      };

      img.onerror = (error) => {
        reject(error);
        URL.revokeObjectURL(url);
      };

      img.src = url;
    });
  };

  const processFiles = async (files) => {
    for (const file of files) {
      const basicInfo = {
        fileName: file.name,
        filePath: file.path || "N/A",
        fileType: file.type,
        duration: 'Loading...', // Default duration text
      };

      if (file.type.includes("audio/")) {
        getAudioDuration(file).then((lengthInSeconds) => {
          onFilesSelect([{ ...basicInfo, duration: `${lengthInSeconds} seconds` }], []);
        });
        onFilesSelect([basicInfo], []); // Immediately update the state with loading status
      } else if (file.type.includes("image/")) {
        const { width, height } = await getImageDimensions(file);
        onFilesSelect([], [{ ...basicInfo, dimensions: `${width}x${height}` }]);
      }
    }
  };

  const handleChooseFiles = (event) => {
    event.preventDefault(); // Prevent default behavior
    document.getElementById("fileInput").click();
  };

  return (
    <div
      className={`${styles.fileUploader} ${highlight ? styles.dragOver : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={styles.fileUploaderBox}>
        Drag or <button onClick={handleChooseFiles}>choose files</button>
      </div>
      <input
        type="file"
        id="fileInput"
        style={{ display: "none" }}
        onChange={handleFileInputChange}
        multiple
      />
    </div>
  );
};

export default FileUploader;
