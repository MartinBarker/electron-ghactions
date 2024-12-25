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
  const [pathSeparator, setPathSeparator] = useState(localStorage.getItem('pathSeparator') || '');
  useEffect(() => {
    if (!pathSeparator) {
      // Fetch the path separator from the main process
      window.api.send('get-path-separator');
      window.api.receive('path-separator-response', (separator) => {
        setPathSeparator(separator);
        localStorage.setItem('pathSeparator', separator); // Cache the separator
      });
    }

    // Cleanup the listener when the component unmounts
    return () => {
      window.api.removeAllListeners('path-separator-response');
    };
  }, [pathSeparator]);

  const [audioFiles, setAudioFiles] = useState(JSON.parse(localStorage.getItem('audioFiles')) || []);
  const [imageFiles, setImageFiles] = useState(JSON.parse(localStorage.getItem('imageFiles')) || []);
  const [outputFolder, setOutputFolder] = useState(localStorage.getItem('outputFolder') || '');
  const [audioRowSelection, setAudioRowSelection] = useState({});
  const [imageRowSelection, setImageRowSelection] = useState({});
  const [ffmpegError, setFfmpegError] = useState(null);

  useEffect(() => {
    localStorage.setItem('audioFiles', JSON.stringify(audioFiles));
    localStorage.setItem('imageFiles', JSON.stringify(imageFiles));
    localStorage.setItem('outputFolder', outputFolder);
  }, [audioFiles, imageFiles, outputFolder]);

  const generateUniqueId = () => {
    return `id-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  };

  const handleOutputFolderChange = (event) => {
    setOutputFolder(event.target.value);
  };
  const handleFilesSelect = (audioData, imageData) => {

    if (audioData.length) {
      setAudioFiles(prev => {
        const updatedFiles = prev.map(file => ({ ...file }));
        audioData.forEach(newFile => {
          const index = updatedFiles.findIndex(f => f.filename === newFile.filename);
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
          const index = updatedImages.findIndex(img => img.filename === newImage.filename);
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
    setOutputFolder('');
    localStorage.removeItem('audioFiles');
    localStorage.removeItem('imageFiles');
    localStorage.removeItem('outputFolder');
  };


  const getSelectedAudioRows = () => {
    const selectedRows = audioFiles.filter((file) => audioRowSelection[file.id]);

    alert(
      selectedRows
        .map((row) => `${row.filename} (${row.duration})`)
        .join('\n') || 'No audio rows selected'
    );
  };

  const getSelectedImageRows = () => {
    const selectedRows = imageFiles.filter((file) => imageRowSelection[file.id]);

    alert(
      selectedRows
        .map((row) => `${row.filename} (${row.dimensions || 'No dimensions'})`)
        .join('\n') || 'No image rows selected'
    );
  };


  const audioColumns = [
    { accessorKey: 'draggable', header: 'Drag' },
    { accessorKey: 'filename', header: 'File Name' }, // Use `filename`
    { accessorKey: 'duration', header: 'Duration' },
  ];

  const imageColumns = [
    { accessorKey: 'draggable', header: 'Drag' },
    { accessorKey: 'filename', header: 'File Name' }, // Use `filename`
    { accessorKey: 'dimensions', header: 'Dimensions' },
  ];

  const handleRender = () => {
    const selectedAudio = audioFiles.filter((file) => audioRowSelection[file.id]);
    const selectedImages = imageFiles.filter((file) => imageRowSelection[file.id]);

    if (selectedAudio.length === 0 || selectedImages.length === 0) {
        alert('Please select at least one audio and one image file.');
        return;
    }

    // If outputFolder is not set, use the first audio file's folder
    if (!outputFolder && selectedAudio.length > 0) {
        const audioFilePath = selectedAudio[0].filepath;
        const folderPath = audioFilePath.split(pathSeparator).slice(0, -1).join(pathSeparator);
        setOutputFolder(folderPath);
        localStorage.setItem('outputFolder', folderPath);
    }

    const defaultOutputFolder = outputFolder || selectedAudio[0].filepath.split(pathSeparator).slice(0, -1).join(pathSeparator);
    const outputFilePath = `${defaultOutputFolder}${pathSeparator}output-video.mp4`;

    console.log('outputFolder:', outputFolder);
    console.log('pathSeparator:', pathSeparator);
    console.log('outputFilePath:', outputFilePath);

    // Create FFmpeg command
    const ffmpegCommand = createFFmpegCommand({
        audioInputs: selectedAudio,
        imageInputs: selectedImages,
        outputFilepath: outputFilePath,
        width: 1920,
        height: 1080,
        paddingCheckbox: false,
        backgroundColor: null,
        stretchImageToFit: false,
        repeatLoop: false,
    });

    console.log('FFmpeg Command:', ffmpegCommand.cmdArgs.join(" "));

    // Send the ffmpeg command to backend
    window.api.send('run-ffmpeg-command', {
        cmdArgs: ffmpegCommand.cmdArgs,
        outputDuration: ffmpegCommand.outputDuration,
    });

    // Handle progress
    window.api.receive('ffmpeg-output', (data) => {
        console.log('FFmpeg Output:', data);
    });

    // Handle errors
    window.api.receive('ffmpeg-error', (data) => {
        console.log('FFmpeg Error:', data);
        setFfmpegError(data); // Set the error message
    });
};



  const handleFilesMetadata = (filesMetadata) => {

    if (!Array.isArray(filesMetadata)) {
      console.error('filesMetadata is not an array:', filesMetadata);
      return;
    }

    filesMetadata.forEach(file => {
      //console.log('Project.js handleFilesMetadata:', file.filepath);
      if (file.filetype === 'audio') {
        setAudioFiles(prev => {
          const index = prev.findIndex(f => f.filepath === file.filepath);
          if (index >= 0) {
            const updatedFiles = [...prev];
            updatedFiles[index] = { ...updatedFiles[index], ...file };
            return updatedFiles;
          } else {
            return [...prev, {
              id: generateUniqueId(),
              filename: file.filename, // Use `filename`
              filepath: file.filepath,
              duration: file.duration || 'Loading...',
            }];
          }
        });
      } else if (file.filetype === 'image') {
        setImageFiles(prev => {
          const index = prev.findIndex(f => f.filepath === file.filepath);
          if (index >= 0) {
            const updatedImages = [...prev];
            updatedImages[index] = { ...updatedImages[index], ...file };
            return updatedImages;
          } else {
            return [...prev, {
              id: generateUniqueId(),
              filename: file.filename, // Use `filename`
              filepath: file.filepath,
              dimensions: file.dimensions || 'Unknown',
            }];
          }
        });
      }
    });
  };


  const updateAudioFiles = (newFile) => {
    setAudioFiles(prev => {
      const index = prev.findIndex(f => f.filepath === newFile.filepath);
      if (index >= 0) {
        const updatedFiles = [...prev];
        updatedFiles[index] = { ...updatedFiles[index], ...newFile };
        return updatedFiles;
      } else {
        return [...prev, { ...newFile, id: generateUniqueId() }];
      }
    });
  };

  const updateImageFiles = (newFile) => {
    setImageFiles(prev => {
      const index = prev.findIndex(f => f.filepath === newFile.filepath);
      if (index >= 0) {
        const updatedImages = [...prev];
        updatedImages[index] = { ...updatedImages[index], ...newFile };
        return updatedImages;
      } else {
        return [...prev, { ...newFile, id: generateUniqueId() }];
      }
    });
  };

  return (
    <div className={styles.projectContainer}>
      <div className={styles.header}>
        <h1 className={styles.projectTitle}>New Project</h1>
        <button className={styles.refreshButton} onClick={clearComponent}>
          Clear
        </button>
      </div>

      <div>
        <label htmlFor="outputFolder">Output Folder:</label>
        <input
          type="text"
          id="outputFolder"
          value={outputFolder}
          onChange={handleOutputFolderChange}
          placeholder="Default: First audio file's folder"
          className={styles.outputFolderInput}
        />
      </div>

      <FileUploader onFilesMetadata={handleFilesMetadata} />

      <h2>Audio Files</h2>
      <Table
        data={audioFiles}
        rowSelection={audioRowSelection}
        setRowSelection={setAudioRowSelection}
        setData={setAudioFiles}
        columns={audioColumns}
      />

      <h2>Image Files</h2>
      <Table
        data={imageFiles}
        rowSelection={imageRowSelection}
        setRowSelection={setImageRowSelection}
        setData={setImageFiles}
        columns={imageColumns}
      />

      <button className={styles.renderButton} onClick={handleRender}>
        Render
      </button>

      {ffmpegError && (
        <div className={styles.errorContainer}>
          <h3>FFmpeg Error:</h3>
          <p>{ffmpegError.message}</p>
          <pre>{ffmpegError.lastOutput}</pre>
        </div>
      )}
    </div>
  );
}

export default Project;