import React, { useState, useEffect } from 'react';
import { isPackaged } from 'electron-is-packaged';
const path = window.require('path');
const os = window.require('os');
//import { FFmpeg, newstartRender, killProcess, generateCueVideoCommand, runFfmpegCommand } from './FFmpeg';

function FfmpegTest() {
  const [logOutput, setLogOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [ffmpegPath, setFfmpegPath] = useState('');

  useEffect(() => {
    setFfmpegPath(getFfmpegPath('ffmpeg'));
  }, []);

  const getFfmpegPath = (cmd = 'ffmpeg') => {
    const platform = os.platform();
    const isDev = !isPackaged;
    let exeName = platform === 'win32' ? `${cmd}.exe` : cmd;

    if (isDev) {
      exeName = `node_modules/ffmpeg-ffprobe-static/${exeName}`;
    } else {
      exeName = path.join(window.process.resourcesPath, `node_modules/ffmpeg-ffprobe-static/${exeName}`);
    }
    return exeName;
  };

  const runFfmpegCommand = async () => {
    setIsRunning(true);
    setLogOutput('');

    try {
      /*
      const { execa } = await import('execa');
      const ffmpegArgs = ['-v', 'info'];
      const process = execa(ffmpegPath, ffmpegArgs);

      process.stdout?.on('data', (data) => {
        setLogOutput((prev) => prev + data.toString());
      });

      process.stderr?.on('data', (data) => {
        setLogOutput((prev) => prev + data.toString());
      });

      await process;
      setLogOutput((prev) => prev + '\nFFmpeg command completed successfully.');
      */
    } catch (error) {
      setLogOutput(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div>
      <h1>FFmpeg Test</h1>
      <button onClick={runFfmpegCommand} disabled={isRunning}>
        {isRunning ? 'Running...' : 'Run FFmpeg Command'}
      </button>
      <pre>{logOutput}</pre>
    </div>
  );
}

export default FfmpegTest;
