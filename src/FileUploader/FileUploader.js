import React, { useState } from "react";
//const { ipcRenderer } = window.require('electron');

import styles from './FileUploader.module.css';
//import { parseBlob } from 'music-metadata-browser';

const FileUploader = ({ onFilesSelect }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [highlight, setHighlight] = useState(false);
  const [imageTableData, setImageTableData] = useState([]);
  const [audioTableData, setAudioTableData] = useState([]);

  const handleFileInputChange = async (event) => {
    const files = event.target.files;
    updateFiles(files);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setHighlight(false);
    const files = event.dataTransfer.files;
    updateFiles(files);
  };

  const formatDuration = (duration) => {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = Math.floor(duration % 60);
    return [hours, minutes, seconds]
      .map((unit) => (unit < 10 ? `0${unit}` : unit))
      .join(":");
  };

  const getAudioMetadata = async (file) => {
    /*
    return parseBlob(file)
      .then((metadata) => metadata)
      .catch((error) => console.log("Metadata parsing error:", error));
  */
 return('apple')
      };

  const updateFiles = async (files) => {
    const newImageTableData = [];
    const newAudioTableData = [];

    for (const file of files) {
      try {
        const fileType = file.type;

        if (fileType.includes("audio/")) {
          let metadata = await getAudioMetadata(file);
          const durationDisplay = metadata
            ? formatDuration(metadata.format.duration)
            : "00:00:00";

          newAudioTableData.push({
            fileName: file.name,
            filePath: file.path || "N/A",
            durationDisplay,
            type: "audio",
          });
        } else if (fileType.includes("image/")) {
          let [width, height] = [200, 400];//await ipcRenderer.invoke("get-image-resolution",file.path);
          newImageTableData.push({
            fileName: file.name,
            filePath: file.path || "N/A",
            dimensions: `${width}x${height}`,
            type: "image",
          });
        }
      } catch (error) {
        console.log("File processing error:", error);
      }
    }

    setSelectedFiles([...files]);
    setAudioTableData((prev) => [...prev, ...newAudioTableData]);
    setImageTableData((prev) => [...prev, ...newImageTableData]);

    onFilesSelect(newAudioTableData, newImageTableData);
  };

  const handleChooseFiles = () => {
    document.getElementById("fileInput").click();
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setHighlight(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setHighlight(false);
  };

  return (
<div
  className={`${styles.fileUploader} ${highlight ? styles.dragOver : ""}`}
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  onDrop={handleDrop}
  onClick={handleChooseFiles}
>
  <div className={styles.fileUploaderBox}>
    <p>
      Drag or <button style={{ cursor: "pointer" }}>choose</button> files
    </p>
  </div>
  <input
    type="file"
    id="fileInput"
    onChange={handleFileInputChange}
    multiple
    style={{ display: "none" }}
  />
</div>
  );
};

export default FileUploader;
