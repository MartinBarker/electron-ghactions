import React, { useState, useEffect, useMemo } from 'react';
import styles from './Project.module.css';
import FileUploader from '../FileUploader/FileUploader.js';
import Table from '../Table/Table.js';
import { createFFmpegCommand } from '../FFmpeg/FFmpegUtils.js';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, horizontalListSortingStrategy, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  const [renders, setRenders] = useState(() => JSON.parse(localStorage.getItem('renders') || '[]'));



  const renderColumns = [
    { accessorKey: 'progress', header: 'Progress', cell: ({ row }) => `${row.original.progress}%` },
    { accessorKey: 'id', header: 'Render ID' },
    { accessorKey: 'outputFilename', header: 'Output Filename' },
    {
      accessorKey: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div>
          <button onClick={() => removeRender(row.original.id)} title="Delete render">
            ❌
          </button>
          <button onClick={() => alert('Placeholder for opening folder')} title="Open folder">
            📂
          </button>
          <button onClick={() => alert('Placeholder for opening file')} title="Open file">
            📄
          </button>
        </div>
      )
    },
  ];

  const getInitialState = (key, defaultValue) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return defaultValue;
    }
  };

  const [pathSeparator, setPathSeparator] = useState(localStorage.getItem('pathSeparator') || '');

  useEffect(() => {
    localStorage.setItem('renders', JSON.stringify(renders));
  }, [renders]);

  const addRender = (render) => {
    setRenders(oldRenders => [...oldRenders, render]);
  };

  const updateRender = (id, update) => {
    console.log('updateRender() :', id, update);
    //BUG when this runs, all the image thumbnails in my component are re-rendered, fix?
    setRenders(renders => renders.map(render => render.id === id ? { ...render, ...update } : render));
  };

  const removeRender = (id) => {
    if (window.confirm("Are you sure you want to delete this render?")) {
      const updatedRenders = renders.filter(render => render.id !== id);
      setRenders(updatedRenders);
    }
  };

  useEffect(() => {
    if (!pathSeparator) {
      // Fetch the path separator from the main process
      window.api.send('get-path-separator');
      window.api.receive('path-separator-response', (separator) => {
        setPathSeparator(separator);
        localStorage.setItem('pathSeparator', separator); // Cache the separator
      });
    }

    window.api.receive('selected-folder', (folder) => {
      setOutputFolder(folder);
    });

    // Cleanup the listener when the component unmounts
    return () => {
      window.api.removeAllListeners('selected-folder');
    };
  }, [pathSeparator]);

  const [audioFiles, setAudioFiles] = useState(getInitialState('audioFiles', []));
  const [imageFiles, setImageFiles] = useState(getInitialState('imageFiles', []));
  const [audioRowSelection, setAudioRowSelection] = useState(getInitialState('audioRowSelection', {}));
  const [imageRowSelection, setImageRowSelection] = useState(getInitialState('imageRowSelection', {}));
  const [ffmpegError, setFfmpegError] = useState(null);

  const [outputFolder, setOutputFolder] = useState(localStorage.getItem('outputFolder') || '');
  const [outputFilename, setOutputFilename] = useState(localStorage.getItem('outputFilename') || 'output-video');
  const [outputFormat, setOutputFormat] = useState(localStorage.getItem('outputFormat') || 'mp4');
  const [videoWidth, setVideoWidth] = useState(localStorage.getItem('videoWidth') || '1920');
  const [videoHeight, setVideoHeight] = useState(localStorage.getItem('videoHeight') || '1080');
  const [backgroundColor, setBackgroundColor] = useState(localStorage.getItem('backgroundColor') || '#000000');
  const [usePadding, setUsePadding] = useState(localStorage.getItem('usePadding') === 'true');

  // Save audio files to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('audioFiles', JSON.stringify(audioFiles));
    } catch (error) {
      console.error('Error saving audioFiles to localStorage:', error);
    }
  }, [audioFiles]);

  // Save image files to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('imageFiles', JSON.stringify(imageFiles));
    } catch (error) {
      console.error('Error saving imageFiles to localStorage:', error);
    }
  }, [imageFiles]);

  // Save row selections to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('audioRowSelection', JSON.stringify(audioRowSelection));
      localStorage.setItem('imageRowSelection', JSON.stringify(imageRowSelection));
    } catch (error) {
      console.error('Error saving row selections to localStorage:', error);
    }
  }, [audioRowSelection, imageRowSelection]);

  useEffect(() => {
    localStorage.setItem('outputFolder', outputFolder);
    localStorage.setItem('outputFilename', outputFilename);
    localStorage.setItem('outputFormat', outputFormat);
    localStorage.setItem('videoWidth', videoWidth);
    localStorage.setItem('videoHeight', videoHeight);
    localStorage.setItem('backgroundColor', backgroundColor);
    localStorage.setItem('usePadding', usePadding);
  }, [outputFolder, outputFilename, outputFormat, videoWidth, videoHeight, backgroundColor, usePadding]);


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
    setOutputFilename('output-video');
    setOutputFormat('mp4');
    setVideoWidth('1920');
    setVideoHeight('1080');
    setBackgroundColor('#000000');
    setUsePadding(false);
    localStorage.clear();
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
    {
      accessorKey: 'draggable',
      header: 'Drag',
      cell: ({ row }) => (
        <div className={styles.dragHandle}></div>
      ),
    },
    {
      accessorKey: 'thumbnail',
      header: 'Thumbnail',
      cell: ({ row }) => <Thumbnail src={row.original.filepath} />,
    },
    { accessorKey: 'filename', header: 'File Name' }, // Use `filename`
    { accessorKey: 'dimensions', header: 'Dimensions' },
  ];
  

  const handleChooseFolder = async () => {
    window.api.send('open-folder-dialog');
    window.api.receive('selected-folder', (folderPath) => {
      if (folderPath) {
        setOutputFolder(folderPath);
      }
    });
  };

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleImageReorder = ({ active, over }) => {
    if (active.id !== over.id) {
      setImageFiles((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const Thumbnail = React.memo(({ src }) => {
    const [isLoaded, setIsLoaded] = useState(false);
  
    return (
      <div className={styles.thumbnailWrapper}>
        {!isLoaded && <div className={styles.placeholder}></div>}
        <img
          src={`thum:///${src}`}
          alt="Thumbnail"
          className={styles.thumbnail}
          onLoad={() => setIsLoaded(true)}
          style={{ display: isLoaded ? 'block' : 'none' }}
        />
      </div>
    );
  }, (prevProps, nextProps) => prevProps.src === nextProps.src);
  


  const SortableImage = ({ file, setImageFiles }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: file.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div ref={setNodeRef} style={style} className={styles.imageItem} {...attributes} {...listeners}>
        <Thumbnail src={file.filepath} />
        <div className={styles.imageOptions}>
          <label>
            <input
              type="checkbox"
              checked={file.padding || false}
              onChange={(e) =>
                setImageFiles((prev) =>
                  prev.map((img) =>
                    img.id === file.id ? { ...img, padding: e.target.checked } : img
                  )
                )
              }
            />
            Padding
          </label>
        </div>
      </div>
    );
  };

  const handleAction = (action, renderId) => {
    switch (action) {
      case 'pause':
      case 'stop':
      case 'start':
      case 'restart':
      case 'delete':
        window.api.send(`ffmpeg-${action}`, { renderId });
        if (action === 'delete') {
          removeRender(renderId);
        }
        break;
      default:
        console.error('Unknown action:', action);
    }
  };

  const handleSelectRow = (id) => {
    setImageRowSelection(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // Ensure the image data is stable if not changed
  const stableImageFiles = useMemo(() => imageFiles.map(file => ({
    ...file,
    isSelected: !!imageRowSelection[file.id]
  })), [imageFiles, imageRowSelection]);

  const handleRender = () => {
    const renderId = generateUniqueId();
    const selectedAudio = audioFiles.filter((file) => audioRowSelection[file.id]);
    const selectedImages = imageFiles.filter((file) => imageRowSelection[file.id]);

    if (selectedAudio.length === 0 || selectedImages.length === 0) {
      alert('Please select at least one audio and one image file.');
      return;
    }

    const outputFilePath = `${outputFolder}${pathSeparator}${outputFilename}.${outputFormat}`;

    const ffmpegCommand = createFFmpegCommand({
      audioInputs: selectedAudio,
      imageInputs: selectedImages,
      outputFilepath: outputFilePath,
      width: parseInt(videoWidth),
      height: parseInt(videoHeight),
      paddingCheckbox: usePadding,
      backgroundColor: backgroundColor,
      stretchImageToFit: false,
      repeatLoop: false,
    });

    console.log('FFmpeg Command:', ffmpegCommand.cmdArgs.join(" "));
    console.log('send duration:', ffmpegCommand.outputDuration);
    window.api.send('run-ffmpeg-command', {
      renderId: renderId,
      cmdArgs: ffmpegCommand.cmdArgs,
      outputDuration: ffmpegCommand.outputDuration,
    });

    window.api.receive('ffmpeg-output', (data) => {
      console.log('FFmpeg Output:', data);
    });

    window.api.receive('ffmpeg-error', (data) => {
      console.log('FFmpeg Error:', data);
      setFfmpegError(data);
      updateRender(renderId, { progress: 'error' }); // Set progress to "error"
    });

    addRender({
      id: renderId,
      pid: null,
      progress: 0,
      outputFolder: 'test'
    });

    window.api.receive('ffmpeg-progress', ({ renderId, pid, progress }) => {
      console.log('FFmpeg Progress received:', renderId, pid, progress);
      updateRender(renderId, { pid, progress });
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
    console.log('updateAudioFiles()')
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

  // Input validation helper functions
  const sanitizeFilename = (filename) => {
    // Allow only alphanumeric characters, underscores, and hyphens
    return filename.replace(/[^a-zA-Z0-9_-]/g, '');
  };

  const sanitizeNumericInput = (value, min, max) => {
    // Remove any non-numeric characters
    const cleanValue = value.toString().replace(/[^0-9]/g, '');
    const numValue = parseInt(cleanValue, 10);

    if (isNaN(numValue)) return min;
    if (min !== undefined && numValue < min) return min;
    if (max !== undefined && numValue > max) return max;

    return numValue;
  };

  const validateHexColor = (color) => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    return hexPattern.test(color) ? color : '#000000';
  };

  const handleOutputFilenameChange = (e) => {
    const sanitizedFilename = sanitizeFilename(e.target.value);
    setOutputFilename(sanitizedFilename);
  };

  const handleVideoWidthChange = (e) => {
    const sanitizedWidth = sanitizeNumericInput(e.target.value, 1, 7680); // 8K max
    setVideoWidth(sanitizedWidth.toString());
  };

  const handleVideoHeightChange = (e) => {
    const sanitizedHeight = sanitizeNumericInput(e.target.value, 1, 4320); // 8K max
    setVideoHeight(sanitizedHeight.toString());
  };

  const handleBackgroundColorChange = (e) => {
    const sanitizedColor = validateHexColor(e.target.value);
    setBackgroundColor(sanitizedColor);
  };

  const handleCloseError = () => {
    setFfmpegError(null);
  };

  const selectedImages = imageFiles.filter((file) => imageRowSelection[file.id]);
  const isHorizontal = windowWidth > 600; // Adjust this breakpoint as needed.


  return (
    <div className={styles.projectContainer}>
      <div className={styles.header}>
        <h1 className={styles.projectTitle}>New Project</h1>
        <button className={styles.refreshButton} onClick={clearComponent}>
          Clear
        </button>
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

      <div className={styles.renderOptionsSection}>
        <h2 className={styles.renderOptionsTitle}>Render Options</h2>
        <div className={styles.renderOptionsGrid}>

          <div className={styles.renderOptionGroup}>
            <label htmlFor="outputFolder" className={styles.renderOptionLabel}>
              Output Folder
            </label>
            <div className={styles.folderInputWrapper}>
              <input
                type="text"
                id="outputFolder"
                value={outputFolder}
                onChange={handleOutputFolderChange}
                placeholder="Choose output folder"
                className={styles.folderInput}
                readOnly
              />
              <button
                onClick={handleChooseFolder}
                className={styles.folderButton}
              >
                Choose Folder
              </button>
            </div>
          </div>

          <div className={styles.renderOptionGroup}>
            <label htmlFor="outputFilename" className={styles.renderOptionLabel}>
              Output Filename
            </label>
            <input
              type="text"
              id="outputFilename"
              value={outputFilename}
              onChange={handleOutputFilenameChange}
              placeholder="Enter filename (letters, numbers, - and _ only)"
              className={styles.renderOptionInput}
              maxLength={255}
            />
          </div>

          <div className={styles.renderOptionGroup}>
            <label htmlFor="outputFormat" className={styles.renderOptionLabel}>
              Output Format
            </label>
            <select
              id="outputFormat"
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
              className={styles.renderOptionSelect}
            >
              <option value="mp4">MP4</option>
              <option value="mkv">MKV</option>
            </select>
          </div>

          <div className={styles.renderOptionGroup}>
            <label htmlFor="videoWidth" className={styles.renderOptionLabel}>
              Width (px)
            </label>
            <input
              type="text"
              id="videoWidth"
              value={videoWidth}
              onChange={handleVideoWidthChange}
              className={styles.renderOptionInput}
              placeholder="Enter width (1-7680)"
              maxLength={4}
            />
          </div>

          <div className={styles.renderOptionGroup}>
            <label htmlFor="videoHeight" className={styles.renderOptionLabel}>
              Height (px)
            </label>
            <input
              type="text"
              id="videoHeight"
              value={videoHeight}
              onChange={handleVideoHeightChange}
              className={styles.renderOptionInput}
              placeholder="Enter height (1-4320)"
              maxLength={4}
            />
          </div>

          <div className={styles.renderOptionGroup}>
            <label htmlFor="backgroundColor" className={styles.renderOptionLabel}>
              Background Color
            </label>
            <input
              type="color"
              id="backgroundColor"
              value={backgroundColor}
              onChange={handleBackgroundColorChange}
              className={styles.renderOptionColor}
            />
          </div>

          <div className={styles.renderOptionGroup}>
            <label className={styles.renderOptionCheckboxLabel}>
              <input
                type="checkbox"
                id="usePadding"
                checked={usePadding}
                onChange={(e) => setUsePadding(e.target.checked)}
                className={styles.renderOptionCheckbox}
              />
              Use Background Padding
            </label>
          </div>
        </div>


          {/* Image Timeline */}
          <div className={styles.renderOptionGroup}>

            <div id="imageTimelineBox">
              <h3 className={styles.blackText}>Image Timeline</h3>
              <DndContext id="imageTimelineContent" collisionDetection={closestCenter} onDragEnd={handleImageReorder}>
                <SortableContext items={selectedImages.map((file) => file.id)} strategy={horizontalListSortingStrategy}>
                  <div className={`${styles.imageTimeline}`}>
                    {selectedImages.map((file) => (
                      <SortableImage key={file.id} file={file} setImageFiles={setImageFiles} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>

        <button
          className={styles.renderButton}
          onClick={handleRender}
          disabled={!outputFolder || !outputFilename}
        >
          Render
        </button>
      </div>

      {ffmpegError && (
        <div className={styles.errorContainer}>
          <button className={styles.closeButton} onClick={handleCloseError}>x</button>
          <h3>FFmpeg Error:</h3>
          <p>{ffmpegError.message}</p>
          <pre>{ffmpegError.lastOutput}</pre>
        </div>
      )}

      <div className={styles.rendersSection}>
        <h2>Renders List</h2>
        <Table
          data={renders.map(render => ({
            progress: render.progress,
            id: render.id,
            outputFilename: `${render.outputFolder}/${render.outputFilename || 'Unknown'}`,
          }))}
          columns={renderColumns}
          rowSelection={{}} // No row selection needed for this table
          setRowSelection={() => {}} // Dummy function
          setData={() => {}} // This table does not modify renders
        />
        {/*
        {renders.map(render => (
          <div key={render.id} className={styles.renderItem}>
            <div>Render ID: {render.id}</div>
            <div>PID: {render.pid}</div>
            <div>Progress: {render.progress}%</div>
            <div>
              <button onClick={() => handleOpenFolder(render.outputFolder)}>Open Folder</button>
              <button onClick={() => handleAction('pause', render.id)}>Pause</button>
              <button onClick={() => handleAction('stop', render.id)}>Stop</button>
              <button onClick={() => handleAction('start', render.id)}>Start</button>
              <button onClick={() => handleAction('restart', render.id)}>Restart</button>
              <button onClick={() => handleAction('delete', render.id)}>Delete</button>
            </div>
          </div>
        ))}
        */}
      </div>
    </div>
  );
}

export default Project;